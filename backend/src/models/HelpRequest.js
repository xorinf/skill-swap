import mongoose from 'mongoose';

const HelpRequestSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, default: '', maxlength: 4000 },
    skillNeeded: { type: String, required: true, trim: true, index: true },
    currentLevel: { type: String, default: '' },
    tried: { type: String, default: '' },
    repoLink: { type: String, default: '' },
    errorTrace: { type: String, default: '' },
    prerequisites: { type: String, default: '' },
    targetGoal: { type: String, default: '' },
    preferredTime: { type: String, default: '' },
    creditReward: { type: Number, default: 0, min: 0 },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ['open', 'in_progress', 'closed'], default: 'open', index: true },
    offers: { type: [mongoose.Schema.Types.ObjectId], default: [] } // user IDs offering help
  },
  { timestamps: true }
);

export const HelpRequest = mongoose.model('HelpRequest', HelpRequestSchema);
