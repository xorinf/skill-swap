import { Conversation } from '../models/Conversation.js';

export async function ensureConversation({ userA, userB, swapRequest, teachSkill, learnSkill, sessionDate }) {
  // Reuse only if both sides are chatting AND no swap is attached yet.
  // Once a swap is bound, that conversation belongs to that swap — leave it alone.
  const existing = await Conversation.findOne({ participants: { $all: [userA, userB] } });
  if (existing && !existing.swapRequest) {
    existing.swapRequest = swapRequest;
    existing.context = { teachSkill, learnSkill, sessionDate };
    await existing.save();
    return existing;
  }
  return Conversation.create({
    participants: [userA, userB],
    swapRequest,
    context: { teachSkill, learnSkill, sessionDate }
  });
}
