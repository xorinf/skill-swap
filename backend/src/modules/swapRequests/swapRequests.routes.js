import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { authRequired } from '../../middleware/auth.js';
import { SwapRequest, Session } from '../../models/SwapRequest.js';
import { Conversation } from '../../models/Conversation.js';
import { ok, created, badRequest, notFound, forbidden, conflict } from '../../utils/response.js';
import { validate } from '../../middleware/validate.js';
import { notify } from '../../services/notifyService.js';
import { ensureConversation } from '../../services/chatService.js';

const router = Router();
router.use(authRequired);

const createSchema = z.object({
  recipient: z.string().min(1),
  teachSkill: z.string().min(1).max(80),
  learnSkill: z.string().min(1).max(80),
  message: z.string().max(1000).optional(),
  proposedTimes: z.array(z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
    note: z.string().max(200).optional()
  })).max(5).optional()
});

router.post('/', validate(createSchema), async (req, res) => {
  const { recipient, teachSkill, learnSkill, message, proposedTimes = [] } = req.body;
  if (recipient === String(req.user._id)) badRequest('Cannot send a swap request to yourself');
  if (!mongoose.isValidObjectId(recipient)) badRequest('Invalid recipient');
  if (proposedTimes.some((t) => new Date(t.end) <= new Date(t.start))) {
    badRequest('Each proposed time must have end after start');
  }

  const existing = await SwapRequest.findOne({
    requester: req.user._id,
    recipient,
    status: { $in: ['pending', 'accepted', 'scheduled'] }
  });
  if (existing) conflict('A pending or active request already exists with this user');

  const sr = await SwapRequest.create({
    requester: req.user._id,
    recipient,
    teachSkill,
    learnSkill,
    message: message || '',
    proposedTimes: proposedTimes.map((t) => ({ ...t, start: new Date(t.start), end: new Date(t.end), proposedBy: req.user._id }))
  });
  await notify(recipient, {
    type: 'swap_request',
    title: 'New swap request',
    body: `${req.user.name} wants to swap ${teachSkill} ↔ ${learnSkill}`,
    data: { swapRequest: sr._id }
  });
  return created(res, { swapRequest: sr });
});

router.get('/sent', async (req, res) => {
  const list = await SwapRequest.find({ requester: req.user._id })
    .sort({ createdAt: -1 })
    .populate('recipient', 'name photo department year')
    .populate('session');
  return ok(res, { swapRequests: list });
});

router.get('/received', async (req, res) => {
  const list = await SwapRequest.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .populate('requester', 'name photo department year')
    .populate('session');
  return ok(res, { swapRequests: list });
});

router.get('/:id', async (req, res) => {
  const sr = await SwapRequest.findById(req.params.id)
    .populate('requester', 'name photo department year')
    .populate('recipient', 'name photo department year')
    .populate('session');
  if (!sr) notFound('Swap request not found');
  const me = String(req.user._id);
  if (String(sr.requester._id) !== me && String(sr.recipient._id) !== me) {
    forbidden('Not your request');
  }
  return ok(res, { swapRequest: sr });
});

const actionSchema = z.object({
  proposedTime: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
    note: z.string().max(200).optional()
  }).optional(),
  reason: z.string().max(300).optional()
});

router.post('/:id/accept', validate(actionSchema), async (req, res) => {
  const sr = await SwapRequest.findById(req.params.id);
  if (!sr) notFound('Swap request not found');
  if (String(sr.recipient) !== String(req.user._id)) forbidden('Only the recipient can accept');
  if (!['pending', 'reschedule_requested'].includes(sr.status)) {
    badRequest('Request is not in an accept-able state');
  }
  const t = req.body.proposedTime;
  if (!t) badRequest('proposedTime is required to accept (start/end)');
  const start = new Date(t.start);
  const end = new Date(t.end);
  if (end <= start) badRequest('end must be after start');

  // Find the corresponding proposed slot, or just accept whichever the recipient picked.
  sr.acceptedTime = { start, end };
  sr.status = 'scheduled';

  // Create the Session record
  const session = await Session.create({
    swapRequest: sr._id,
    teacher: sr.requester, // requester offers to TEACH (their teachSkill)
    learner: sr.recipient, // recipient LEARNS it
    teachSkill: sr.teachSkill,
    learnSkill: sr.learnSkill,
    scheduledStart: start,
    scheduledEnd: end,
    durationMinutes: Math.max(15, Math.round((end - start) / 60000)),
    status: 'scheduled'
  });
  sr.session = session._id;
  await sr.save();

  // Open conversation scoped to this swap
  await ensureConversation({ userA: sr.requester, userB: sr.recipient, swapRequest: sr._id, teachSkill: sr.teachSkill, learnSkill: sr.learnSkill, sessionDate: start });

  await notify(sr.requester, {
    type: 'swap_accepted',
    title: 'Swap accepted',
    body: `Your swap was accepted for ${start.toLocaleString()}`,
    data: { swapRequest: sr._id, session: session._id }
  });
  return ok(res, { swapRequest: sr, session });
});

router.post('/:id/reject', validate(actionSchema), async (req, res) => {
  const sr = await SwapRequest.findById(req.params.id);
  if (!sr) notFound();
  if (String(sr.recipient) !== String(req.user._id)) forbidden();
  if (['completed', 'cancelled', 'rejected', 'expired'].includes(sr.status)) badRequest('Already closed');
  sr.status = 'rejected';
  await sr.save();
  await notify(sr.requester, {
    type: 'swap_rejected',
    title: 'Swap declined',
    body: `${req.user.name} declined your swap.`,
    data: { swapRequest: sr._id }
  });
  return ok(res, { swapRequest: sr });
});

router.post('/:id/cancel', async (req, res) => {
  const sr = await SwapRequest.findById(req.params.id);
  if (!sr) notFound();
  const me = String(req.user._id);
  if (String(sr.requester) !== me && String(sr.recipient) !== me) forbidden();
  if (['completed', 'cancelled', 'rejected', 'expired'].includes(sr.status)) badRequest('Already closed');
  sr.status = 'cancelled';
  sr.cancelledBy = req.user._id;
  await sr.save();
  const other = String(sr.requester) === me ? sr.recipient : sr.requester;
  await notify(other, { type: 'swap_cancelled', title: 'Swap cancelled', body: '', data: { swapRequest: sr._id } });
  return ok(res, { swapRequest: sr });
});

router.post('/:id/reschedule', validate(z.object({
  proposedTime: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
    note: z.string().max(200).optional()
  })
})), async (req, res) => {
  const sr = await SwapRequest.findById(req.params.id);
  if (!sr) notFound();
  const me = String(req.user._id);
  if (String(sr.requester) !== me && String(sr.recipient) !== me) forbidden();
  if (!['scheduled', 'pending', 'reschedule_requested'].includes(sr.status)) badRequest('Cannot reschedule now');
  const { start, end, note } = req.body.proposedTime;
  sr.proposedTimes.push({ start: new Date(start), end: new Date(end), note: note || '', proposedBy: req.user._id });
  sr.status = 'reschedule_requested';
  await sr.save();
  const other = String(sr.requester) === me ? sr.recipient : sr.requester;
  await notify(other, { type: 'swap_reschedule', title: 'Reschedule proposed', body: '', data: { swapRequest: sr._id } });
  return ok(res, { swapRequest: sr });
});

export default router;
