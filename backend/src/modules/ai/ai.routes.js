import { Router } from 'express';
import { z } from 'zod';
import { authRequired } from '../../middleware/auth.js';
import { aiConfigured } from '../../config/index.js';
import { ok, badRequest } from '../../utils/response.js';
import { validate } from '../../middleware/validate.js';
import { extractIntent } from '../../services/aiService.js';
import { findMatches } from '../../services/matchService.js';

const router = Router();
router.use(authRequired);

const searchSchema = z.object({
  prompt: z.string().min(3).max(500),
  limit: z.number().int().min(1).max(50).optional()
});

router.post('/', validate(searchSchema), async (req, res) => {
  const { prompt, limit = 15 } = req.body;
  // Extract skills first, then match against the parsed skills (regex-safe).
  const pre = await extractIntent(prompt);
  // Guard: short talk or vague prompts — surface the conversational reply, skip the match query.
  if (pre.reply) {
    return ok(res, { ...pre, matches: [] });
  }
  const query = pre.intent?.skills?.[0] || undefined;
  const matches = await findMatches(req.user, { query, limit });
  const out = await extractIntent(prompt, matches);
  return ok(res, out);
});

export default router;
