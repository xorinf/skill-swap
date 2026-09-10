// Central error middleware. Maps known errors to JSON, hides stack in production.
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { ApiError } from '../utils/response.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ ok: false, error: { message: `Route not found: ${req.method} ${req.path}` } });
}

export function errorHandler(err, req, res, _next) {
  // Mongoose validation
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      ok: false,
      error: { message: 'Validation failed', details: Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message])) }
    });
  }
  // Duplicate key
  if (err && err.code === 11000) {
    return res.status(409).json({ ok: false, error: { message: 'Duplicate value', details: err.keyValue } });
  }
  // Zod
  if (err instanceof ZodError) {
    return res.status(400).json({
      ok: false,
      error: { message: 'Validation failed', details: err.flatten() }
    });
  }
  // Our typed errors
  if (err instanceof ApiError) {
    return res.status(err.status).json({ ok: false, error: { message: err.message, details: err.details } });
  }
  // JWT
  if (err && err.name === 'JsonWebTokenError') {
    return res.status(401).json({ ok: false, error: { message: 'Invalid token' } });
  }
  if (err && err.name === 'TokenExpiredError') {
    return res.status(401).json({ ok: false, error: { message: 'Token expired' } });
  }
  // Fallback
  // eslint-disable-next-line no-console
  console.error('[unhandled]', err);
  res.status(500).json({
    ok: false,
    error: { message: process.env.NODE_ENV === 'production' ? 'Server error' : err.message }
  });
}
