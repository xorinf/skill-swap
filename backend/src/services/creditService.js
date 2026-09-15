// Time-credit accounting. Atomic per session, idempotent.
import { Session, CreditTxn, SwapRequest } from '../models/SwapRequest.js';
import User from '../models/User.js';

const TEACHER_EARN = 1;
const LEARNER_SPEND = 1;

export async function settleCredits(session) {
  // Atomic gate: only the first caller whose update lands will run settlement.
  // Stops double-credit/double-debit when both sides click "verify" at once.
  const claimed = await Session.findOneAndUpdate(
    { _id: session._id, creditSettled: { $ne: true } },
    { $set: { creditSettled: true } },
    { new: true }
  );
  if (!claimed) return false;
  // Re-read with the session the caller passed (already populated enough for our needs).
  const sessionId = claimed._id;

  const teacher = await User.findById(claimed.teacher);
  const learner = await User.findById(claimed.learner);
  if (!teacher || !learner) throw new Error('Users missing for session');

  teacher.timeCredits += TEACHER_EARN;
  teacher.sessionsAttended += 1;
  await teacher.save();
  await CreditTxn.create({
    user: teacher._id,
    type: 'session_earned_teach',
    amount: TEACHER_EARN,
    balanceAfter: teacher.timeCredits,
    reason: `Taught ${claimed.teachSkill}`,
    session: sessionId,
    swapRequest: claimed.swapRequest
  });

  learner.timeCredits = Math.max(0, learner.timeCredits - LEARNER_SPEND);
  learner.sessionsAttended += 1;
  await learner.save();
  await CreditTxn.create({
    user: learner._id,
    type: 'session_spent_learn',
    amount: -LEARNER_SPEND,
    balanceAfter: learner.timeCredits,
    reason: `Learned ${claimed.learnSkill}`,
    session: sessionId,
    swapRequest: claimed.swapRequest
  });

  return true;
}
