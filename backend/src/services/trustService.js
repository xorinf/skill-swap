// Trust score is a defensible composite of completions, ratings, no-shows and bans.
// Single source of truth so the profile, match card, and dashboard agree.
import User from '../models/User.js';
import { Review } from '../models/SwapRequest.js';

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

export async function recomputeTrust(userId) {
  const u = await User.findById(userId);
  if (!u) return null;
  const reviews = await Review.find({ ratee: userId });
  const count = reviews.length;
  const avg = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;

  const success = u.sessionsAttended; // sessions verified & completed
  const cancels = u.sessionsCancelled;
  const noShows = u.noShows;

  // Defensible 0..100 score. Rating contributes up to 60, success up to 30, penalties subtract.
  let score = 50; // base
  if (count > 0) {
    score += (avg - 3) * 20; // -40..+40
  }
  score += Math.min(30, success * 3);
  score -= Math.min(20, cancels * 4);
  score -= Math.min(30, noShows * 10);
  score = clamp(Math.round(score), 0, 100);

  u.ratingAvg = Number(avg.toFixed(2));
  u.ratingsCount = count;
  u.trustScore = score;

  // Earn badges
  const badges = new Set(u.badges);
  if (success >= 1) badges.add('First Session');
  if (success >= 5) badges.add('Helper');
  if (success >= 15) badges.add('Mentor');
  if (count >= 5 && avg >= 4.5) badges.add('Top Rated');
  if (u.skillsCanTeach.length >= 5) badges.add('Polyglot');
  u.badges = Array.from(badges);

  await u.save();
  return { trustScore: u.trustScore, ratingAvg: u.ratingAvg, ratingsCount: u.ratingsCount, badges: u.badges };
}
