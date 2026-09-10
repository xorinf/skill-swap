import mongoose from 'mongoose';
import { PROFICIENCY_LEVELS } from '../utils/constants.js';

const SkillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, default: 'Other' },
    proficiency: { type: String, enum: PROFICIENCY_LEVELS, default: 'intermediate' },
    yearsOfExperience: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const AvailabilitySlotSchema = new mongoose.Schema(
  {
    day: { type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], required: true },
    start: { type: String, required: true }, // "HH:mm"
    end: { type: String, required: true }    // "HH:mm"
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: { type: String, required: true, select: false },
    department: { type: String, default: '' },
    year: { type: String, default: '' }, // e.g. "2nd year"
    bio: { type: String, default: '', maxlength: 600 },
    photo: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' }
    },
    skillsCanTeach: { type: [SkillSchema], default: [] },
    skillsToLearn: { type: [SkillSchema], default: [] },
    availability: { type: [AvailabilitySlotSchema], default: [] },
    timeCredits: { type: Number, default: 2, min: 0 }, // signup bonus
    trustScore: { type: Number, default: 50, min: 0, max: 100 },
    ratingsCount: { type: Number, default: 0 },
    ratingAvg: { type: Number, default: 0 },
    sessionsTaught: { type: Number, default: 0 },
    sessionsAttended: { type: Number, default: 0 },
    sessionsCancelled: { type: Number, default: 0 },
    noShows: { type: Number, default: 0 },
    badges: { type: [String], default: [] },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    isBanned: { type: Boolean, default: false },
    lastSeenAt: { type: Date, default: Date.now },
    onboarded: { type: Boolean, default: false }
  },
  { timestamps: true }
);

UserSchema.methods.toPublic = function () {
  const o = this.toObject({ versionKey: false });
  delete o.passwordHash;
  delete o.isBanned;
  return o;
};

export default mongoose.model('User', UserSchema);
