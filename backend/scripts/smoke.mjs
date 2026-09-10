// End-to-end smoke for the backend happy path.
// Walks: register/login -> profile -> matches -> AI prompt -> swap request -> accept -> chat -> start -> otp -> verify -> review
// Also exercises failure modes: duplicate request, wrong OTP, self-request.
import http from 'node:http';
import { io as ioClient } from 'socket.io-client';

const BASE = 'http://127.0.0.1:5050';

function req(method, path, { body, cookie, token, query } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    if (query) for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (cookie) headers.Cookie = cookie;
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
    const r = http.request({ method, hostname: url.hostname, port: url.port, path: url.pathname + url.search, headers }, (res) => {
      let chunks = '';
      res.on('data', (c) => chunks += c);
      res.on('end', () => {
        const setCookie = res.headers['set-cookie'] || [];
        const token = setCookie.map((c) => c.split(';')[0]).join('; ');
        let json = null;
        try { json = JSON.parse(chunks); } catch { /* not json */ }
        resolve({ status: res.statusCode, json, raw: chunks, cookie: token });
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

function expect(cond, label) {
  if (!cond) { console.error('FAIL', label); process.exit(1); }
  else console.log('OK  ', label);
}

async function loginAs(email) {
  const r = await req('POST', '/api/auth/login', { body: { email, password: 'password123' } });
  expect(r.status === 200 && r.json.ok, `login ${email}`);
  return { token: r.json.data.token, cookie: r.cookie, user: r.json.data.user };
}async function main() {
  console.log('--- backend smoke ---');
  // 0) health
  let r = await req('GET', '/api/health');
  expect(r.status === 200 && r.json.ok, 'health 200');

  // 1) login two seeded users
  const a = await loginAs('aarav.sharma@anurag.edu.in');
  const d = await loginAs('diya.reddy@anurag.edu.in');

  // 2) auth-required endpoint
  r = await req('GET', '/api/auth/me', { token: a.token });
  expect(r.status === 200 && r.json.data.user.email === 'aarav.sharma@anurag.edu.in', 'me works with JWT');

  // 3) wrong domain rejected on register
  r = await req('POST', '/api/auth/register', { body: { name: 'X', email: 'x@gmail.com', password: 'password123' } });
  expect(r.status === 400, 'register rejects non-anurag email');

  // 4) profile update
  r = await req('PUT', '/api/users/me', { token: a.token, body: { bio: 'Smoke test updated bio.' } });
  expect(r.status === 200 && r.json.data.user.bio.includes('Smoke'), 'update bio');

  // 5) matches: aarav should match with diya (reciprocal) and rohan/python
  r = await req('GET', '/api/matches', { token: a.token });
  expect(r.status === 200 && r.json.data.matches.length > 0, 'matches returned');
  const top = r.json.data.matches[0];
  expect(top.match.score > 0, 'top match has positive score');
  console.log('   top match:', top.user.name, 'score', top.match.score);

  // 6) AI prompt
  r = await req('POST', '/api/ai', { token: a.token, body: { prompt: 'I need someone who can teach me Figma and is free Saturday evening. I can teach React in return.' } });
  expect(r.status === 200, 'ai prompt 200');
  expect(r.json.data.intent.skills.includes('figma'), 'ai extracted figma');

  // 7) send swap request aarav -> diya
  const start = new Date(Date.now() + 2 * 86400_000).toISOString();
  const end = new Date(Date.now() + 2 * 86400_000 + 3600_000).toISOString();
  r = await req('POST', '/api/swap-requests', { token: a.token, body: {
    recipient: d.user._id, teachSkill: 'React', learnSkill: 'Figma',
    message: 'Smoke test request',
    proposedTimes: [{ start, end }]
  }});
  expect(r.status === 201, 'create swap request');
  const srId = r.json.data.swapRequest._id;

  // 8) duplicate pending rejected
  r = await req('POST', '/api/swap-requests', { token: a.token, body: {
    recipient: d.user._id, teachSkill: 'React', learnSkill: 'Figma',
    proposedTimes: [{ start, end }]
  }});
  expect(r.status === 409, 'duplicate pending request blocked');

  // 9) self request rejected
  r = await req('POST', '/api/swap-requests', { token: a.token, body: {
    recipient: a.user._id, teachSkill: 'X', learnSkill: 'Y',
    proposedTimes: [{ start, end }]
  }});
  expect(r.status === 400, 'self-request blocked');

  // 10) recipient accepts
  r = await req('POST', `/api/swap-requests/${srId}/accept`, { token: d.token, body: { proposedTime: { start, end } } });
  expect(r.status === 200 && r.json.data.session, 'accept creates session');
  const sessionId = r.json.data.session._id;

  // 11) messaging
  const convs = await req('GET', '/api/messages', { token: a.token });
  expect(convs.status === 200 && convs.json.data.conversations.length > 0, 'conversation exists');
  const convId = convs.json.data.conversations[0]._id;
  r = await req('POST', `/api/messages/${convId}/messages`, { token: a.token, body: { text: 'Hello from smoke test' } });
  expect(r.status === 201, 'send message');

  // 12) start + issue OTP
  r = await req('POST', `/api/sessions/session/${sessionId}/start`, { token: a.token });
  expect(r.status === 200, 'session started');
  r = await req('POST', `/api/sessions/session/${sessionId}/issue-otp`, { token: a.token });
  expect(r.status === 200 && r.json.data.code, 'otp issued');
  const otp = r.json.data.code;

  // 13) wrong otp rejected
  r = await req('POST', `/api/sessions/session/${sessionId}/verify-otp`, { token: d.token, body: { code: '0000' } });
  expect(r.status === 400, 'wrong otp rejected');

  // 14) correct otp accepted; both confirm
  r = await req('POST', `/api/sessions/session/${sessionId}/verify-otp`, { token: d.token, body: { code: otp } });
  expect(r.status === 200, 'otp verified by learner');
  r = await req('POST', `/api/sessions/session/${sessionId}/verify-otp`, { token: a.token, body: { code: otp } });
  expect(r.status === 200, 'otp verified by teacher');
  expect(r.json.data.session.status === 'verified', 'session marked verified');

  // 15) credits settled
  const credits = await req('GET', '/api/credits/summary', { token: a.token });
  expect(credits.json.data.balance >= 6, 'aarav earned credit (>=6)');
  const credits2 = await req('GET', '/api/credits/summary', { token: d.token });
  expect(credits2.json.data.balance >= 3, 'diya spent credit (>=3)');

  // 16) reviews
  r = await req('POST', `/api/sessions/session/${sessionId}/review`, { token: a.token, body: { rating: 5, comment: 'Great session' } });
  expect(r.status === 200, 'review submitted by teacher');
  r = await req('POST', `/api/sessions/session/${sessionId}/review`, { token: a.token, body: { rating: 5 } });
  expect(r.status === 409, 'duplicate review blocked');

  // 17) feed
  r = await req('GET', '/api/posts', { token: a.token });
  expect(r.status === 200 && r.json.data.posts.length > 0, 'feed returns posts');

  // 18) socket connect
  await new Promise((resolve, reject) => {
    const s = ioClient('http://127.0.0.1:5050', { auth: { token: a.token }, transports: ['websocket'] });
    let connected = false;
    s.on('connect', () => { connected = true; s.disconnect(); resolve(); });
    s.on('connect_error', (e) => reject(e));
    setTimeout(() => { if (!connected) reject(new Error('socket timeout')); }, 5000);
  });
  console.log('OK   socket auth + connect');

  console.log('\nALL OK');
}

main().catch((e) => { console.error('ERR', e); process.exit(1); });
