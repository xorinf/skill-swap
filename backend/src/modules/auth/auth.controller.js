import bcrypt from 'bcryptjs';
import User from '../../models/User.js';
import { signToken, setAuthCookie, clearAuthCookie } from '../../middleware/auth.js';
import { ok, created, badRequest, unauthorized, conflict } from '../../utils/response.js';
import { config } from '../../config/index.js';

const BCRYPT_ROUNDS = 10;

function emailDomain(email) {
  const at = email.indexOf('@');
  return at === -1 ? '' : email.slice(at + 1).toLowerCase();
}

function publicUser(u) {
  return u.toPublic();
}

export async function register(req, res) {
  const { name, email, password, department, year } = req.body || {};
  if (!name || !email || !password) badRequest('name, email and password are required');
  if (password.length < 8) badRequest('Password must be at least 8 characters');

  const domain = emailDomain(email);
  if (domain !== config.allowedEmailDomain) {
    badRequest(`Email must be a ${config.allowedEmailDomain} address`);
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) conflict('Email already registered');

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    department: department || '',
    year: year || ''
  });

  // Signup bonus credit transaction is implicit via default 2; create the txn record.
  const { CreditTxn } = await import('../../models/SwapRequest.js');
  await CreditTxn.create({
    user: user._id,
    type: 'signup_bonus',
    amount: 2,
    balanceAfter: user.timeCredits,
    reason: 'Welcome bonus'
  });

  const token = signToken(user._id);
  setAuthCookie(res, token);
  return created(res, { token, user: publicUser(user) });
}

export async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) badRequest('email and password are required');
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) unauthorized('Invalid credentials');
  const okPw = await bcrypt.compare(password, user.passwordHash);
  if (!okPw) unauthorized('Invalid credentials');
  if (user.isBanned) unauthorized('Account banned');
  user.lastSeenAt = new Date();
  await user.save();
  const token = signToken(user._id);
  setAuthCookie(res, token);
  return ok(res, { token, user: publicUser(user) });
}

export async function logout(_req, res) {
  clearAuthCookie(res);
  return ok(res, { ok: true });
}

export async function me(req, res) {
  return ok(res, { user: publicUser(req.user) });
}
