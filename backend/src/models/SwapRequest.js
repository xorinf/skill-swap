import mongoose from 'mongoose';
import { REQUEST_STATUSES, SESSION_STATUSES } from '../utils/constants.js';

const ProposedTimeSchema = new mongoose.Schema(
  {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    note: { type: String, default: '' },
    proposedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const SwapRequestSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    teachSkill: { type: String, required: true, trim: true },
    learnSkill: { type: String, required: true, trim: true },
    message: { type: String, default: '', maxlength: 1000 },
    status: { type: String, enum: REQUEST_STATUSES, default: 'pending', index: true },
    proposedTimes: { type: [ProposedTimeSchema], default: [] },
    acceptedTime: { start: Date, end: Date },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', default: null },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    completedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

SwapRequestSchema.index({ requester: 1, status: 1 });
SwapRequestSchema.index({ recipient: 1, status: 1 });

const OtpSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { _id: false }
);

const SessionSchema = new mongoose.Schema(
  {
    swapRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'SwapRequest', required: true, index: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    learner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    teachSkill: { type: String, required: true },
    learnSkill: { type: String, required: true },
    scheduledStart: { type: Date, required: true },
    scheduledEnd: { type: Date, required: true },
    durationMinutes: { type: Number, default: 60, min: 15 },
    status: { type: String, enum: SESSION_STATUSES, default: 'scheduled', index: true },
    otp: { type: OtpSchema, default: null },
    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: [mongoose.Schema.Types.ObjectId], default: [] }, // both should confirm
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    summary: { type: String, default: '' },
    resources: {
      type: [
        {
          url: String,
          publicId: String,
          name: String,
          mime: String
        }
      ],
      default: []
    },
    creditSettled: { type: Boolean, default: false }
  },
  { timestamps: true }
);

SessionSchema.index({ teacher: 1, scheduledStart: 1 });
SessionSchema.index({ learner: 1, scheduledStart: 1 });

const ReviewSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
    swapRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'SwapRequest', required: true },
    rater: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ratee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: '', maxlength: 800 }
  },
  { timestamps: true }
);

ReviewSchema.index({ session: 1, rater: 1 }, { unique: true });

const CreditTxnSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    amount: { type: Number, required: true }, // positive = earn, negative = spend
    balanceAfter: { type: Number, required: true },
    reason: { type: String, default: '' },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', default: null },
    swapRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'SwapRequest', default: null }
  },
  { timestamps: true }
);

CreditTxnSchema.index({ user: 1, createdAt: -1 });

export const SwapRequest = mongoose.model('SwapRequest', SwapRequestSchema);
export const Session = mongoose.model('Session', SessionSchema);
export const Review = mongoose.model('Review', ReviewSchema);
export const CreditTxn = mongoose.model('CreditTxn', CreditTxnSchema);
