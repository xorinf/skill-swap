import { Router } from 'express';
import { z } from 'zod';
import { authRequired } from '../../middleware/auth.js';
import { HelpRequest } from '../../models/HelpRequest.js';
import { ok, created, badRequest, notFound, forbidden } from '../../utils/response.js';
import { validate } from '../../middleware/validate.js';
import { notify } from '../../services/notifyService.js';

const router = Router();
router.use(authRequired);

const createSchema = z.object({
  title: z.string().min(2).max(140),
  description: z.string().max(4000).optional(),
  skillNeeded: z.string().min(1).max(80),
  currentLevel: z.string().max(120).optional(),
  tried: z.string().max(2000).optional(),
  repoLink: z.string().url().optional().or(z.literal('')),
  errorTrace: z.string().max(4000).optional(),
  prerequisites: z.string().max(600).optional(),
  targetGoal: z.string().max(600).optional(),
  preferredTime: z.string().max(120).optional(),
  creditReward: z.number().int().min(0).max(10).optional(),
  tags: z.array(z.string().max(30)).max(8).optional()
});

router.get('/', async (req, res) => {
  const { status = 'open', q, limit = 20, page = 0 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (q) filter.$or = [
    { title: new RegExp(q, 'i') },
    { skillNeeded: new RegExp(q, 'i') },
    { tags: new RegExp(q, 'i') }
  ];
  const lim = Math.min(Number(limit) || 20, 50);
  const list = await HelpRequest.find(filter)
    .sort({ createdAt: -1 })
    .skip(Number(page) * lim)
    .limit(lim)
    .populate('author', 'name photo department year trustScore');
  return ok(res, { helpRequests: list });
});

router.post('/', validate(createSchema), async (req, res) => {
  const created1 = await HelpRequest.create({ ...req.body, author: req.user._id });
  const full = await HelpRequest.findById(created1._id).populate('author', 'name photo department year trustScore');
  return created(res, { helpRequest: full });
});

router.get('/:id', async (req, res) => {
  const hr = await HelpRequest.findById(req.params.id).populate('author', 'name photo department year trustScore');
  if (!hr) notFound();
  return ok(res, { helpRequest: hr });
});

router.post('/:id/offer', async (req, res) => {
  const hr = await HelpRequest.findById(req.params.id);
  if (!hr) notFound();
  if (String(hr.author) === String(req.user._id)) badRequest('Cannot offer on your own request');
  const me = String(req.user._id);
  if (!hr.offers.find((x) => String(x) === me)) {
    hr.offers.push(req.user._id);
    await hr.save();
  }
  await notify(hr.author, {
    type: 'wishlist_offer',
    title: 'Someone offered to help',
    body: `${req.user.name} offered help on "${hr.title}"`,
    data: { helpRequest: hr._id, helper: req.user._id }
  });
  return ok(res, { helpRequest: hr });
});

export default router;
