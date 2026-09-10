import mongoose from 'mongoose';
import { POST_INTENTS } from '../utils/constants.js';

const PostSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    intent: { type: String, enum: POST_INTENTS, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    body: { type: String, default: '', maxlength: 4000 },
    tags: { type: [String], default: [] },
    image: { url: { type: String, default: '' }, publicId: { type: String, default: '' } },
    creditReward: { type: Number, default: 0, min: 0 },
    relatedSkills: { type: [String], default: [] },
    helpRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'HelpRequest', default: null },
    likes: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    commentsCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

PostSchema.index({ createdAt: -1 });

const CommentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, maxlength: 1000 }
  },
  { timestamps: true }
);

export const Post = mongoose.model('Post', PostSchema);
export const Comment = mongoose.model('Comment', CommentSchema);
