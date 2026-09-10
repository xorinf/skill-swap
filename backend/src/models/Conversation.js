import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, default: '' },
    attachment: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
      type: { type: String, default: '' }, // image | file
      name: { type: String, default: '' },
      size: { type: Number, default: 0 }
    },
    readBy: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    system: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const ConversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      required: true,
      validate: (v) => v.length === 2
    },
    swapRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'SwapRequest', default: null },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    lastMessagePreview: { type: String, default: '' },
    context: {
      // Snapshot of the swap the conversation was created for, so it shows in chat UI.
      teachSkill: { type: String, default: '' },
      learnSkill: { type: String, default: '' },
      sessionDate: { type: Date, default: null }
    }
  },
  { timestamps: true }
);

ConversationSchema.index({ participants: 1, lastMessageAt: -1 });

export const Conversation = mongoose.model('Conversation', ConversationSchema);
export const Message = mongoose.model('Message', MessageSchema);
