import { Server } from 'socket.io';
import * as cookie from 'cookie';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { attachIo } from '../services/notifyService.js';
import { Conversation } from '../models/Conversation.js';

const userRoom = (id) => `user:${id}`;
const userSockets = new Map(); // userId -> Set<socketId>

export function attachSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: config.allowedOrigins, credentials: true }
  });
  attachIo(io);

  // Auth: client sends the JWT in cookie OR in auth payload.
  io.use((socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || '';
      const cookies = cookie.parse(cookieHeader);
      const token = cookies.token || socket.handshake.auth?.token;
      if (!token) return next(new Error('Missing token'));
      const payload = jwt.verify(token, config.jwtSecret);
      socket.userId = String(payload.sub);
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const uid = socket.userId;
    socket.join(userRoom(uid));
    if (!userSockets.has(uid)) userSockets.set(uid, new Set());
    userSockets.get(uid).add(socket.id);
    io.emit('presence:update', { userId: uid, online: true });

    // Auto-join rooms for every conversation this user participates in.
    // Lets `socket.to(conversationId).emit(...)` actually reach the other participant.
    try {
      const convs = await Conversation.find({ participants: uid }, { _id: 1 }).lean();
      for (const c of convs) socket.join(String(c._id));
    } catch (err) {
      console.error('[ws] failed to auto-join conversation rooms:', err.message);
    }

    socket.on('disconnect', () => {
      const set = userSockets.get(uid);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) {
          userSockets.delete(uid);
          io.emit('presence:update', { userId: uid, online: false });
        }
      }
    });

    socket.on('typing', ({ conversationId }) => {
      socket.to(conversationId).emit('typing', { conversationId, userId: uid });
    });
    socket.on('stop-typing', ({ conversationId }) => {
      socket.to(conversationId).emit('stop-typing', { conversationId, userId: uid });
    });
  });

  return io;
}

export function emitToUser(userId, event, payload) {
  // Use module-level io through notify? Simpler: store io in a global cache.
  globalThis.__io?.to(userRoom(userId)).emit(event, payload);
}

export function isOnline(userId) {
  return userSockets.has(String(userId));
}
