import http from 'node:http';
import { createApp } from './app.js';
import { config } from './config/index.js';
import { connectDB } from './config/db.js';
import { attachSockets } from './sockets/index.js';

async function start() {
  try {
    await connectDB();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[mongo] failed to connect:', err.message);
    // Continue starting so health endpoint works; routes will surface the error.
  }

  const app = createApp();
  const server = http.createServer(app);
  const io = attachSockets(server);
  globalThis.__io = io;

  server.listen(config.port, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(`[server] listening on http://localhost:${config.port}`);
  });
}

start();
