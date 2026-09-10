import { Router } from 'express';
import { z } from 'zod';
import { authRequired } from '../../middleware/auth.js';
import { Post, Comment } from '../../models/Post.js';
import { ok, created, badRequest, notFound, forbidden } from '../../utils/response.js';
import { validate } from '../../middleware/validate.js';
import { POST_INTENTS } from '../../utils/constants.js';

const router = Router();
router.use(authRequired);

const postSchema = z.object({
  intent: z.enum(POST_INTENTS),
  title: z.string().min(2).max(140),
  body: z.string().max(4000).optional(),
  tags: z.array(z.string().max(30)).max(8).optional(),
  relatedSkills: z.array(z.string().max(60)).max(8).optional(),
  creditReward: z.number().int().min(0).max(10).optional(),
  image: z.object({ url: z.string().url(), publicId: z.string() }).optional()
});

router.get('/', async (req, res) => {
  const { intent, limit = 20, page = 0, q } = req.query;
  const filter = {};
  if (intent) filter.intent = intent;
  if (q) filter.$or = [
    { title: new RegExp(q, 'i') },
    { body: new RegExp(q, 'i') },
    { tags: new RegExp(q, 'i') }
  ];
  const lim = Math.min(Number(limit) || 20, 50);
  const list = await Post.find(filter)
    .sort({ createdAt: -1 })
    .skip(Number(page) * lim)
    .limit(lim)
    .populate('author', 'name photo department year trustScore');
  return ok(res, { posts: list });
});

router.post('/', validate(postSchema), async (req, res) => {
  const p = await Post.create({ ...req.body, author: req.user._id });
  const full = await Post.findById(p._id).populate('author', 'name photo department year trustScore');
  return created(res, { post: full });
});

router.get('/:id', async (req, res) => {
  const p = await Post.findById(req.params.id)
    .populate('author', 'name photo department year trustScore');
  if (!p) notFound();
  const comments = await Comment.find({ post: p._id })
    .sort({ createdAt: 1 })
    .populate('author', 'name photo department year');
  return ok(res, { post: p, comments });
});

router.delete('/:id', async (req, res) => {
  const p = await Post.findById(req.params.id);
  if (!p) notFound();
  if (String(p.author) !== String(req.user._id) && req.user.role !== 'admin') forbidden();
  await p.deleteOne();
  return ok(res, { ok: true });
});

router.post('/:id/like', async (req, res) => {
  const p = await Post.findById(req.params.id);
  if (!p) notFound();
  const me = String(req.user._id);
  const idx = p.likes.findIndex((x) => String(x) === me);
  if (idx >= 0) p.likes.splice(idx, 1);
  else p.likes.push(req.user._id);
  await p.save();
  return ok(res, { likes: p.likes.length, liked: idx < 0 });
});

const commentSchema = z.object({ text: z.string().min(1).max(1000) });

router.post('/:id/comments', validate(commentSchema), async (req, res) => {
  const p = await Post.findById(req.params.id);
  if (!p) notFound();
  const c = await Comment.create({ post: p._id, author: req.user._id, text: req.body.text });
  p.commentsCount += 1;
  await p.save();
  const populated = await c.populate('author', 'name photo department year');
  return created(res, { comment: populated });
});

export default router;
