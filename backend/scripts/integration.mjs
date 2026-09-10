// Final integration smoke: walks all public API endpoints as a logged-in user.
// Surfaces any 4xx/5xx the UI would hit.
import http from 'node:http';

const BASE = 'http://127.0.0.1:5050';

function req(method, path, { body, token } = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
    const r = http.request({ method, hostname: '127.0.0.1', port: 5050, path, headers }, (res) => {
      let chunks = '';
      res.on('data', (c) => chunks += c);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(chunks); } catch { /* not json */ }
        resolve({ status: res.statusCode, json, raw: chunks });
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

let pass = 0, fail = 0;
function check(label, cond) { if (cond) { pass++; console.log('OK  ', label); } else { fail++; console.error('FAIL', label); } }

async function main() {
  const r = await req('POST', '/api/auth/login', { body: { email: 'aarav.sharma@anurag.edu.in', password: 'password123' } });
  const { token, user } = r.json.data;

  // All GETs the home page makes
  const a = await Promise.all([
    req('GET', '/api/matches?limit=6', { token }),
    req('GET', '/api/posts?limit=3', { token }),
    req('GET', '/api/sessions/mine', { token }),
    req('GET', '/api/notifications/unread-count', { token })
  ]);
  check('GET /matches', a[0].status === 200);
  check('GET /posts', a[1].status === 200);
  check('GET /sessions/mine', a[2].status === 200);
  check('GET /notifications/unread-count', a[3].status === 200);

  // Profile pages
  const p = await req('GET', `/api/users/${user._id}`, { token });
  check('GET /users/:id', p.status === 200);

  // Edit profile path
  const ep = await req('PUT', '/api/users/me', { token, body: { bio: 'integration ok' } });
  check('PUT /users/me', ep.status === 200);

  // Skill add/remove
  const add = await req('POST', '/api/users/me/skills/teach', { token, body: { skill: { name: 'GoLang', category: 'Programming', proficiency: 'beginner' } } });
  check('POST /users/me/skills/teach', add.status === 200);
  const del = await req('DELETE', '/api/users/me/skills/teach/GoLang', { token });
  check('DELETE /users/me/skills/teach/:name', del.status === 200);

  // Availability
  const av = await req('PUT', '/api/users/me/availability', { token, body: { slots: [{ day: 'Sun', start: '10:00', end: '12:00' }] } });
  check('PUT /users/me/availability', av.status === 200);

  // Feed interactions
  const posts = await req('GET', '/api/posts?intent=NEED_HELP', { token });
  check('GET /posts?intent=NEED_HELP', posts.status === 200);
  if (posts.json?.data?.posts?.[0]) {
    const pid = posts.json.data.posts[0]._id;
    const like = await req('POST', `/api/posts/${pid}/like`, { token });
    check('POST /posts/:id/like', like.status === 200);
    const c = await req('POST', `/api/posts/${pid}/comments`, { token, body: { text: 'integration test' } });
    check('POST /posts/:id/comments', c.status === 201);
  }

  // Help request flow
  const hr = await req('POST', '/api/help-requests', { token, body: { title: 'Need React tips', skillNeeded: 'React', description: 'I want help with a project' } });
  check('POST /help-requests', hr.status === 201);
  if (hr.json?.data?.helpRequest) {
    const hrid = hr.json.data.helpRequest._id;
    const list = await req('GET', '/api/help-requests', { token });
    check('GET /help-requests', list.status === 200);
    const detail = await req('GET', `/api/help-requests/${hrid}`, { token });
    check('GET /help-requests/:id', detail.status === 200);
  }

  // Messages
  const ml = await req('GET', '/api/messages', { token });
  check('GET /messages', ml.status === 200);

  // Credits
  const cr = await req('GET', '/api/credits/summary', { token });
  check('GET /credits/summary', cr.status === 200);
  const ch = await req('GET', '/api/credits/history', { token });
  check('GET /credits/history', ch.status === 200);

  // Impact
  const im = await req('GET', '/api/impact/me', { token });
  check('GET /impact/me', im.status === 200);

  // Notifications
  const no = await req('GET', '/api/notifications', { token });
  check('GET /notifications', no.status === 200);
  if (no.json?.data?.notifications?.[0]) {
    const nid = no.json.data.notifications[0]._id;
    const nr = await req('POST', `/api/notifications/${nid}/read`, { token });
    check('POST /notifications/:id/read', nr.status === 200);
  }
  const ra = await req('POST', '/api/notifications/read-all', { token });
  check('POST /notifications/read-all', ra.status === 200);

  // AI
  const ai = await req('POST', '/api/ai', { token, body: { prompt: 'I want to learn Figma and I can teach React. Available Saturday.' } });
  check('POST /ai', ai.status === 200);

  // Uploads signature (Cloudinary configured → expect 200; absent → 400)
  const up = await req('POST', '/api/uploads/signature', { token, body: {} });
  check('POST /uploads/signature (cloudinary configured)', up.status === 200);

  // Auth boundary
  const noToken = await req('GET', '/api/matches');
  check('GET /matches without token → 401', noToken.status === 401);

  console.log(`\n${pass} pass / ${fail} fail`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
