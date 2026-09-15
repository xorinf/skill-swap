import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config, cloudinaryConfigured, aiConfigured } from './config/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import matchesRoutes from './modules/matches/matches.routes.js';
import swapRoutes from './modules/swapRequests/swapRequests.routes.js';
import postsRoutes from './modules/posts/posts.routes.js';
import helpRoutes from './modules/helpRequests/helpRequests.routes.js';
import messagesRoutes from './modules/messages/messages.routes.js';
import sessionsRoutes from './modules/sessions/sessions.routes.js';
import creditsRoutes from './modules/credits/credits.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';
import impactRoutes from './modules/impact/impact.routes.js';
import aiRoutes from './modules/ai/ai.routes.js';
import uploadsRoutes from './modules/uploads/uploads.routes.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({
    origin: (origin, cb) => {
      // allow same-origin / curl / mobile (no Origin header)
      if (!origin) return cb(null, true);
      if (config.allowedOrigins.includes(origin)) return cb(null, true);
      if (config.allowedOrigins.includes('*')) return cb(null, true);
      return cb(null, false);
    },
    credentials: true
  }));
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());
  if (config.nodeEnv !== 'test') app.use(morgan('dev'));

  // Lightweight rate limit on auth
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);

  app.get('/api/health', (_req, res) => res.json({
    ok: true,
    service: 'skill-swap-backend',
    cloudinary: cloudinaryConfigured,
    ai: aiConfigured,
    env: config.nodeEnv
  }));

  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/matches', matchesRoutes);
  app.use('/api/swap-requests', swapRoutes);
  app.use('/api/posts', postsRoutes);
  app.use('/api/help-requests', helpRoutes);
  app.use('/api/messages', messagesRoutes);
  app.use('/api/sessions', sessionsRoutes);
  app.use('/api/credits', creditsRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/impact', impactRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/uploads', uploadsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
