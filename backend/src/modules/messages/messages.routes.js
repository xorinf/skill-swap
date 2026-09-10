import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { authRequired } from '../../middleware/auth.js';
import { Conversation, Message } from '../../models/Conversation.js';
import { ok, created, badRequest, notFound, forbidden } from '../../utils/response.js';
import { validate } from '../../middleware/validate.js';
import { notify } from '../../services/notifyService.js';
import { emitToUser } from '../../sockets/index.js';

const router = Router();
router.use(authRequired);

const sendSchema = z.object({
  text: z.string().max(2000).optional(),
  attachment: z.object({
    url: z.string().url(),
    publicId: z.string(),
    type: z.enum(['image', 'file']),
    name: z.string().max(160),
    size: z.number().int().min(0).max(20 * 1024 * 1024)
  }).optional()
}).refine((v) => v.text || v.attachment, { message: 'text or attachment is required' });

router.get('/', async (req, res) => {
  const list = await Conversation.find({ participants: req.user._id })
    .sort({ lastMessageAt: -1 })
    .populate('participants', 'name photo department year');
  return ok(res, { conversations: list });
});

router.post('/with/:userId', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.userId)) badRequest('Invalid userId');
  if (req.params.userId === String(req.user._id)) badRequest('Cannot chat with yourself');
  const { ensureConversation } = await import('../../services/chatService.js');
  const conv = await ensureConversation({ userA: req.user._id, userB: req.params.userId, swapRequest: null, teachSkill: '', learnSkill: '', sessionDate: null });
  const full = await Conversation.findById(conv._id).populate('participants', 'name photo department year');
  return created(res, { conversation: full });
});

router.get('/:id/messages', async (req, res) => {
  const conv = await Conversation.findById(req.params.id);
  if (!conv) notFound();
  if (!conv.participants.some((p) => String(p) === String(req.user._id))) forbidden();
  const messages = await Message.find({ conversationId: conv._id }).sort({ createdAt: 1 }).limit(500);
  return ok(res, { messages });
});

router.post('/:id/messages', validate(sendSchema), async (req, res) => {
  const conv = await Conversation.findById(req.params.id);
  if (!conv) notFound();
  if (!conv.participants.some((p) => String(p) === String(req.user._id))) forbidden();
  const msg = await Message.create({
    conversationId: conv._id,
    sender: req.user._id,
    text: req.body.text || '',
    attachment: req.body.attachment || undefined
  });
  conv.lastMessageAt = msg.createdAt;
  conv.lastMessagePreview = req.body.text ? req.body.text.slice(0, 80) : (req.body.attachment ? '📎 Attachment' : '');
  await conv.save();
  const other = conv.participants.find((p) => String(p) !== String(req.user._id));
  if (other) {
    await notify(other, {
      type: 'new_message',
      title: `Message from ${req.user.name}`,
      body: conv.lastMessagePreview,
      data: { conversation: conv._id, message: msg._id }
    });
    emitToUser(String(other), 'message:new', { conversationId: conv._id, message: msg });
  }
  return created(res, { message: msg });
});

router.post('/:id/read', async (req, res) => {
  const conv = await Conversation.findById(req.params.id);
  if (!conv) notFound();
  if (!conv.participants.some((p) => String(p) === String(req.user._id))) forbidden();
  await Message.updateMany(
    { conversationId: conv._id, readBy: { $ne: req.user._id } },
    { $addToSet: { readBy: req.user._id } }
  );
  return ok(res, { ok: true });
});

export default router;
