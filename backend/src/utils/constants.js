// Skill categories — small static lookup used by skills + matching.
// Adding categories = adding a line here, not a new collection.
export const SKILL_CATEGORIES = [
  'Programming',
  'Web Development',
  'Mobile Development',
  'Data Science',
  'Machine Learning',
  'Design',
  'UI/UX',
  'Product',
  'Marketing',
  'Writing',
  'Languages',
  'Mathematics',
  'Electronics',
  'Robotics',
  'Photography',
  'Music',
  'Sports',
  'Other'
];

export const PROFICIENCY_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

export const POST_INTENTS = ['OFFERING', 'NEED_HELP', 'PROJECT'];

export const REQUEST_STATUSES = [
  'pending',
  'accepted',
  'rejected',
  'cancelled',
  'reschedule_requested',
  'scheduled',
  'completed',
  'verified',
  'expired'
];

export const SESSION_STATUSES = [
  'scheduled',
  'in_progress',
  'otp_pending',
  'verified',
  'completed',
  'cancelled',
  'no_show'
];

export const CREDIT_TYPES = [
  'session_earned_teach',
  'session_spent_learn',
  'signup_bonus',
  'admin_adjustment',
  'refund'
];

export const SLOT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
