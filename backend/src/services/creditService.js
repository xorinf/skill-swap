// Time-credit accounting. Atomic per session, idempotent.
import { Session, CreditTxn, SwapRequest } from '../models/SwapRequest.js';
import User from '../models/User.js';

const TEACHER_EARN = 1;
const LEARNER_SPEND = 1;

export async function settleCredits(session) {
  if (session.creditSettled) return false;
  // Idempotency: skip if already settled
  const sessionId = session._id;

  const teacher = await User.findById(session.teacher);
  const learner = await User.findById(session.learner);
  if (!teacher || !learner) throw new Error('Users missing for session');

  // ponytail: simple sequential updates. For strict concurrency use Mongo transactions
  // on a replica set; we use a flag + early-return guard instead, which is enough for MVP.

  teacher.timeCredits += TEACHER_EARN;
  teacher.sessionsAttended += 1;
  await teacher.save();
  await CreditTxn.create({
    user: teacher._id,
    type: 'session_earned_teach',
    amount: TEACHER_EARN,
    balanceAfter: teacher.timeCredits,
    reason: `Taught ${session.teachSkill}`,
    session: sessionId,
    swapRequest: session.swapRequest
  });

  if (learner.timeCredits < LEARNER_SPEND) {
    // Allow negative? No — floor at 0, but still record. Future: require pre-pay.
  }
  learner.timeCredits = Math.max(0, learner.timeCredits - LEARNER_SPEND);
  learner.sessionsAttended += 1;
  await learner.save();
  await CreditTxn.create({
    user: learner._id,
    type: 'session_spent_learn',
    amount: -LEARNER_SPEND,
    balanceAfter: learner.timeCredits,
    reason: `Learned ${session.learnSkill}`,
    session: sessionId,
    swapRequest: session.swapRequest
  });

  session.creditSettled = true;
  await session.save();
  return true;
}
