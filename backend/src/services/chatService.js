import { Conversation } from '../models/Conversation.js';

export async function ensureConversation({ userA, userB, swapRequest, teachSkill, learnSkill, sessionDate }) {
  const existing = await Conversation.findOne({ participants: { $all: [userA, userB] } });
  if (existing) {
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
