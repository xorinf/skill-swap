import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'swap_request',
        'swap_accepted',
        'swap_rejected',
        'swap_reschedule',
        'swap_cancelled',
        'session_upcoming',
        'session_verified',
        'session_completed',
        'new_message',
        'rating_prompt',
        'badge_earned',
        'wishlist_offer'
      ],
      required: true
    },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

NotificationSchema.index({ user: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', NotificationSchema);
