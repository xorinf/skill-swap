// Notification creation + optional socket push. Drops silently if no io attached.
import { Notification } from '../models/Notification.js';

let ioRef = null;
export function attachIo(io) { ioRef = io; }

export async function notify(userId, { type, title, body = '', data = {} }) {
  const n = await Notification.create({ user: userId, type, title, body, data });
  if (ioRef) {
    try { ioRef.to(`user:${String(userId)}`).emit('notification', n); } catch { /* ignore */ }
  }
  return n;
}
