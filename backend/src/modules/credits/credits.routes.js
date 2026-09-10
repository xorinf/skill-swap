import { Router } from 'express';
import { authRequired } from '../../middleware/auth.js';
import { CreditTxn } from '../../models/SwapRequest.js';
import { ok } from '../../utils/response.js';
import User from '../../models/User.js';

const router = Router();
router.use(authRequired);

router.get('/summary', async (req, res) => {
  const u = await User.findById(req.user._id);
  return ok(res, { balance: u.timeCredits });
});

router.get('/history', async (req, res) => {
  const list = await CreditTxn.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('session', 'teachSkill learnSkill scheduledStart')
    .populate('swapRequest', 'teachSkill learnSkill');
  return ok(res, { transactions: list, balance: req.user.timeCredits });
});

export default router;
