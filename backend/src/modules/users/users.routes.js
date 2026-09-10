import { Router } from 'express';
import User from '../../models/User.js';
import { authRequired } from '../../middleware/auth.js';
import { ok, badRequest, notFound, forbidden } from '../../utils/response.js';
import { validate } from '../../middleware/validate.js';
import { z } from 'zod';
import { SKILL_CATEGORIES, PROFICIENCY_LEVELS, SLOT_DAYS } from '../../utils/constants.js';
import { cloudinary, cloudinaryConfigured } from '../../config/cloudinary.js';
import { recomputeTrust } from '../../services/trustService.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const router = Router();
router.use(authRequired);

const skillSchema = z.object({
  name: z.string().min(1).max(60),
  category: z.string().max(40).optional(),
  proficiency: z.enum(PROFICIENCY_LEVELS).optional(),
  yearsOfExperience: z.number().int().min(0).max(60).optional()
});

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

const slotSchema = z.object({
  day: z.enum(SLOT_DAYS),
  start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
}).refine((s) => timeToMinutes(s.end) > timeToMinutes(s.start), {
  message: 'end must be after start'
});

const updateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  department: z.string().max(80).optional(),
  year: z.string().max(20).optional(),
  bio: z.string().max(600).optional(),
  skillsCanTeach: z.array(skillSchema).max(30).optional(),
  skillsToLearn: z.array(skillSchema).max(30).optional(),
  availability: z.array(slotSchema).max(60).optional(),
  photo: z.object({ url: z.string().url().optional(), publicId: z.string().optional() }).optional(),
  onboarded: z.boolean().optional()
});

router.get('/me', (req, res) => ok(res, { user: req.user.toPublic() }));

router.put('/me', validate(updateSchema), async (req, res) => {
  const updates = req.body;
  Object.assign(req.user, updates);
  req.user.onboarded = true;
  await req.user.save();
  await recomputeTrust(req.user._id);
  return ok(res, { user: req.user.toPublic() });
});

router.post('/me/photo', async (req, res) => {
  if (!cloudinaryConfigured) badRequest('Cloudinary not configured');
  const { publicId, url } = req.body || {};
  if (!publicId || !url) badRequest('publicId and url are required');
  // Best-effort: store the new ref. (Optional: also delete the previous publicId.)
  if (req.user.photo?.publicId && req.user.photo.publicId !== publicId) {
    try { await cloudinary.uploader.destroy(req.user.photo.publicId); } catch { /* ignore */ }
  }
  req.user.photo = { publicId, url };
  await req.user.save();
  return ok(res, { user: req.user.toPublic() });
});

router.post('/me/skills/teach', validate(z.object({ skill: skillSchema })), async (req, res) => {
  req.user.skillsCanTeach.push(req.body.skill);
  await req.user.save();
  return ok(res, { user: req.user.toPublic() });
});

router.delete('/me/skills/teach/:name', async (req, res) => {
  const before = req.user.skillsCanTeach.length;
  req.user.skillsCanTeach = req.user.skillsCanTeach.filter((s) => s.name.toLowerCase() !== req.params.name.toLowerCase());
  if (req.user.skillsCanTeach.length === before) notFound('Skill not found');
  await req.user.save();
  return ok(res, { user: req.user.toPublic() });
});

router.post('/me/skills/learn', validate(z.object({ skill: skillSchema })), async (req, res) => {
  req.user.skillsToLearn.push(req.body.skill);
  await req.user.save();
  return ok(res, { user: req.user.toPublic() });
});

router.delete('/me/skills/learn/:name', async (req, res) => {
  const before = req.user.skillsToLearn.length;
  req.user.skillsToLearn = req.user.skillsToLearn.filter((s) => s.name.toLowerCase() !== req.params.name.toLowerCase());
  if (req.user.skillsToLearn.length === before) notFound('Skill not found');
  await req.user.save();
  return ok(res, { user: req.user.toPublic() });
});

router.put('/me/availability', validate(z.object({ slots: z.array(slotSchema) })), async (req, res) => {
  req.user.availability = req.body.slots;
  await req.user.save();
  return ok(res, { user: req.user.toPublic() });
});

router.get('/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) notFound('User not found');
  if (user.isBanned) forbidden('User not available');
  return ok(res, { user: user.toPublic() });
});

router.get('/', async (req, res) => {
  const { skill, department, q, limit = 20 } = req.query;
  const filter = { _id: { $ne: req.user._id }, isBanned: false };
  if (department) filter.department = department;
  if (skill) {
    const re = new RegExp(escapeRegex(skill), 'i');
    filter.$or = [{ 'skillsCanTeach.name': re }, { 'skillsToLearn.name': re }];
  }
  if (q) filter.name = new RegExp(escapeRegex(q), 'i');
  const users = await User.find(filter).limit(Math.min(Number(limit) || 20, 50));
  return ok(res, { users: users.map((u) => u.toPublic()) });
});

export default router;
