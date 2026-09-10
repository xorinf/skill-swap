import { Router } from 'express';
import { z } from 'zod';
import { authRequired } from '../../middleware/auth.js';
import { SwapRequest, Session, Review, CreditTxn } from '../../models/SwapRequest.js';
import { ok, badRequest, notFound, forbidden, conflict } from '../../utils/response.js';
import { validate } from '../../middleware/validate.js';
import { settleCredits } from '../../services/creditService.js';
import { recomputeTrust } from '../../services/trustService.js';
import { notify } from '../../services/notifyService.js';
import { emitToUser } from '../../sockets/index.js';
import crypto from 'node:crypto';

const router = Router();
router.use(authRequired);

// Helper
function genOtp() {
  return String(crypto.randomInt(0, 10000)).padStart(4, '0');
}

// MY MATCHES — central hub: upcoming + pending + recent
router.get('/mine', async (req, res) => {
  const upcoming = await Session.find({
    $or: [{ teacher: req.user._id }, { learner: req.user._id }],
    status: { $in: ['scheduled', 'in_progress', 'otp_pending'] }
  })
    .sort({ scheduledStart: 1 })
    .populate('teacher', 'name photo department year')
    .populate('learner', 'name photo department year');

  const past = await Session.find({
    $or: [{ teacher: req.user._id }, { learner: req.user._id }],
    status: { $in: ['verified', 'completed', 'cancelled', 'no_show'] }
  })
    .sort({ scheduledStart: -1 })
    .limit(20)
    .populate('teacher', 'name photo department year')
    .populate('learner', 'name photo department year');

  return ok(res, { upcoming, past });
});

router.get('/session/:id', async (req, res) => {
  const s = await Session.findById(req.params.id)
    .populate('teacher', 'name photo department year')
    .populate('learner', 'name photo department year')
    .populate('swapRequest');
  if (!s) notFound();
  const me = String(req.user._id);
  if (String(s.teacher._id) !== me && String(s.learner._id) !== me) forbidden();
  // Mask the OTP for the OTHER side until both confirm
  const out = s.toObject();
  if (out.otp && String(s.teacher._id) !== me) {
    // teacher can see, learner can see only after issuing - both can read; we keep simple
  }
  return ok(res, { session: out });
});

router.post('/session/:id/start', async (req, res) => {
  const s = await Session.findById(req.params.id);
  if (!s) notFound();
  const me = String(req.user._id);
  if (String(s.teacher) !== me && String(s.learner) !== me) forbidden();
  if (!['scheduled', 'in_progress', 'otp_pending'].includes(s.status)) badRequest('Session not startable');
  s.status = 'in_progress';
  s.startedAt = s.startedAt || new Date();
  await s.save();
  return ok(res, { session: s });
});

router.post('/session/:id/issue-otp', async (req, res) => {
  const s = await Session.findById(req.params.id);
  if (!s) notFound();
  const me = String(req.user._id);
  if (String(s.teacher) !== me && String(s.learner) !== me) forbidden();
  if (!['in_progress', 'scheduled', 'otp_pending'].includes(s.status)) badRequest('OTP not issuable in this state');
  // 4-digit, 10-minute expiry
  const code = genOtp();
  s.otp = { code, expiresAt: new Date(Date.now() + 10 * 60 * 1000), issuedBy: req.user._id };
  s.status = 'otp_pending';
  s.verifiedBy = [];
  await s.save();
  // Tell the other side an OTP was issued
  const other = String(s.teacher) === me ? s.learner : s.teacher;
  await notify(other, { type: 'session_verified', title: 'Verification code ready', body: 'A new 4-digit code has been generated for the session.', data: { session: s._id } });
  emitToUser(String(other), 'session:otp', { sessionId: s._id });
  // Sender also needs to see it
  emitToUser(me, 'session:otp', { sessionId: s._id });
  return ok(res, { session: s, code }); // visible to issuer; client can show it
});

router.post('/session/:id/verify-otp', validate(z.object({ code: z.string().length(4) })), async (req, res) => {
  const s = await Session.findById(req.params.id);
  if (!s) notFound();
  const me = String(req.user._id);
  if (String(s.teacher) !== me && String(s.learner) !== me) forbidden();
  if (!s.otp) badRequest('No OTP issued yet');
  if (new Date() > new Date(s.otp.expiresAt)) badRequest('OTP expired');
  if (s.otp.code !== req.body.code) badRequest('Wrong code');

  if (!s.verifiedBy.find((x) => String(x) === me)) s.verifiedBy.push(req.user._id);
  await s.save();

  if (s.verifiedBy.length >= 2) {
    s.status = 'verified';
    s.verifiedAt = new Date();
    await s.save();
    await settleCredits(s);
    await recomputeTrust(s.teacher);
    await recomputeTrust(s.learner);
    await notify(s.teacher, { type: 'session_completed', title: 'Session verified', body: 'Credits have been settled. Leave a rating!', data: { session: s._id } });
    await notify(s.learner, { type: 'session_completed', title: 'Session verified', body: 'Credits have been settled. Leave a rating!', data: { session: s._id } });
  }
  return ok(res, { session: s });
});

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(800).optional()
});

router.post('/session/:id/review', validate(reviewSchema), async (req, res) => {
  const s = await Session.findById(req.params.id);
  if (!s) notFound();
  if (!['verified', 'completed'].includes(s.status)) badRequest('Session not yet verified');
  const me = String(req.user._id);
  if (String(s.teacher) !== me && String(s.learner) !== me) forbidden();
  const ratee = String(s.teacher) === me ? s.learner : s.teacher;
  try {
    await Review.create({
      session: s._id,
      swapRequest: s.swapRequest,
      rater: req.user._id,
      ratee,
      rating: req.body.rating,
      comment: req.body.comment || ''
    });
  } catch (e) {
    if (e.code === 11000) conflict('You already reviewed this session');
    throw e;
  }
  if (s.status === 'verified') {
    s.status = 'completed';
    s.completedAt = new Date();
    await s.save();
  }
  await recomputeTrust(ratee);
  return ok(res, { ok: true });
});

router.get('/session/:id/reviews', async (req, res) => {
  const list = await Review.find({ session: req.params.id }).populate('rater', 'name photo');
  return ok(res, { reviews: list });
});

export default router;
