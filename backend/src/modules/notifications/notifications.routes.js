import { Router } from 'express';
import { authRequired } from '../../middleware/auth.js';
import { Notification } from '../../models/Notification.js';
import { ok } from '../../utils/response.js';

const router = Router();
router.use(authRequired);

router.get('/', async (req, res) => {
  const list = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  return ok(res, { notifications: list });
});

router.get('/unread-count', async (req, res) => {
  const count = await Notification.countDocuments({ user: req.user._id, read: false });
  return ok(res, { count });
});

router.post('/:id/read', async (req, res) => {
  const n = await Notification.findOne({ _id: req.params.id, user: req.user._id });
  if (n) { n.read = true; await n.save(); }
  return ok(res, { ok: true });
});

router.post('/read-all', async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
  return ok(res, { ok: true });
});

export default router;
