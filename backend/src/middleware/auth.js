import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { unauthorized, forbidden } from '../utils/response.js';
import User from '../models/User.js';

export function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, config.jwtSecret, { expiresIn: config.jwtExpires });
}

export function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

export function clearAuthCookie(res) {
  res.clearCookie('token');
}

function extractToken(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  if (req.cookies && req.cookies.token) return req.cookies.token;
  return null;
}

export async function authRequired(req, _res, next) {
  try {
    const token = extractToken(req);
    if (!token) unauthorized('Missing token');
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(payload.sub);
    if (!user) unauthorized('User not found');
    if (user.isBanned) forbidden('Account banned');
    req.user = user;
    req.userId = user._id;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return unauthorized();
    if (!roles.includes(req.user.role)) return forbidden('Insufficient role');
    next();
  };
}
