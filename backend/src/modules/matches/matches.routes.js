import { Router } from 'express';
import { authRequired } from '../../middleware/auth.js';
import { findMatches } from '../../services/matchService.js';
import { ok } from '../../utils/response.js';

const router = Router();
router.use(authRequired);

router.get('/', async (req, res) => {
  const { q, limit } = req.query;
  const matches = await findMatches(req.user, { query: q, limit: Number(limit) || 20 });
  return ok(res, { matches });
});

export default router;
