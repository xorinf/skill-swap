import { Router } from 'express';
import { authRequired } from '../../middleware/auth.js';
import { Session, SwapRequest } from '../../models/SwapRequest.js';
import { ok } from '../../utils/response.js';
import User from '../../models/User.js';

const router = Router();
router.use(authRequired);

router.get('/me', async (req, res) => {
  const u = await User.findById(req.user._id);
  const [completed, sessionsTaught, sessionsAttended] = await Promise.all([
    Session.countDocuments({ $or: [{ teacher: u._id }, { learner: u._id }], status: { $in: ['completed', 'verified'] } }),
    Session.countDocuments({ teacher: u._id, status: { $in: ['completed', 'verified'] } }),
    Session.countDocuments({ learner: u._id, status: { $in: ['completed', 'verified'] } })
  ]);

  const totalMinutes = await Session.aggregate([
    { $match: { $or: [{ teacher: u._id }, { learner: u._id }], status: { $in: ['completed', 'verified'] } } },
    { $group: { _id: null, total: { $sum: '$durationMinutes' } } }
  ]);
  const hours = Math.round(((totalMinutes[0]?.total || 0) / 60) * 10) / 10;

  return ok(res, {
    impact: {
      name: u.name,
      department: u.department,
      year: u.year,
      trustScore: u.trustScore,
      ratingAvg: u.ratingAvg,
      ratingsCount: u.ratingsCount,
      sessionsCompleted: completed,
      sessionsTaught,
      sessionsAttended,
      hoursExchanged: hours,
      timeCredits: u.timeCredits,
      skillsTaught: u.skillsCanTeach.length,
      skillsLearned: u.skillsToLearn.length,
      badges: u.badges
    }
  });
});

export default router;
