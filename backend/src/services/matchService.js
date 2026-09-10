// Matching engine. Weighted, deterministic, well-tested with a known ceiling.
// ponytail: O(n) scan over users; switch to indexed text search if user count grows past ~10k.
import User from '../models/User.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const WEIGHTS = {
  reciprocal: 0.45,   // A teaches what B wants AND B teaches what A wants
  oneWay: 0.25,       // A teaches what B wants OR B teaches what A wants
  availability: 0.15, // overlap on day+time
  trust: 0.10,
  activity: 0.05
};

function normName(s) { return (s || '').trim().toLowerCase(); }

function overlap(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return 0;
  const setA = new Map(a.map((s) => [normName(s.day) + '|' + s.start + '-' + s.end, true]));
  let o = 0;
  for (const s of b) {
    if (setA.has(normName(s.day) + '|' + s.start + '-' + s.end)) o++;
  }
  return o;
}

function skillMatches(me, other, direction) {
  // direction: 'teach' = me wants to learn (so match against other's teach skills)
  const mine = (direction === 'teach' ? me.skillsToLearn : me.skillsCanTeach).map((s) => normName(s.name));
  const theirs = (direction === 'teach' ? other.skillsCanTeach : other.skillsToLearn).map((s) => normName(s.name));
  return mine.filter((m) => m && theirs.includes(m));
}

export function scoreUser(me, other) {
  // Reciprocal: each side has something the other wants
  const aWantsMine = skillMatches(me, other, 'learn'); // I can teach what they want to learn
  const bWantsMine = skillMatches(me, other, 'teach'); // I want to learn what they teach
  const reciprocal = aWantsMine.length > 0 && bWantsMine.length > 0;
  const oneWay = aWantsMine.length > 0 || bWantsMine.length > 0;
  if (!oneWay) return null;

  const skillScore = reciprocal ? 1 : 0.5;
  const av = overlap(me.availability, other.availability) > 0 ? 1 : 0;
  const trust = (other.trustScore || 0) / 100;
  const activity = Math.min(1, (other.sessionsAttended || 0) / 10);

  const total =
    skillScore * (reciprocal ? WEIGHTS.reciprocal : WEIGHTS.oneWay) +
    av * WEIGHTS.availability +
    trust * WEIGHTS.trust +
    activity * WEIGHTS.activity;

  return {
    score: Math.round(total * 100),
    reasons: {
      reciprocal,
      aWantsMine,
      bWantsMine,
      availabilityOverlap: av,
      trust: other.trustScore || 0,
      activity: other.sessionsAttended || 0
    }
  };
}

export async function findMatches(me, { query, limit = 20 } = {}) {
  const filter = { _id: { $ne: me._id }, isBanned: false };
  if (query) {
    const re = new RegExp(escapeRegex(query), 'i');
    filter.$or = [{ 'skillsCanTeach.name': re }, { 'skillsToLearn.name': re }];
  }
  const users = await User.find(filter).limit(500);
  const ranked = [];
  for (const u of users) {
    const r = scoreUser(me, u);
    if (!r) continue;
    ranked.push({ user: u.toPublic(), match: r });
  }
  ranked.sort((a, b) => b.match.score - a.match.score);
  return ranked.slice(0, limit);
}
