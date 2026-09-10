import { Router } from 'express';
import { z } from 'zod';
import { register, login, logout, me } from './auth.controller.js';
import { authRequired } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(120),
  department: z.string().max(80).optional(),
  year: z.string().max(20).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', authRequired, me);

export default router;
