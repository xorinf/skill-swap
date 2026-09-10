// Audit: walk every page's API dependencies as a logged-in user.
// Surfaces any 4xx/5xx or shape mismatches.
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
const issues = [];
function check(label, cond, detail) { if (cond) { pass++; } else { fail++; issues.push({ label, detail }); } }

async function main() {
  const login = await req('POST', '/api/auth/login', { body: { email: 'aarav.sharma@anurag.edu.in', password: 'password123' } });
  check('login', login.status === 200 && login.json?.ok, login.raw?.slice(0, 200));
  if (login.status !== 200) { console.log(issues); process.exit(1); }
  const { token, user } = login.json.data;

  // HOME
  const home = await Promise.all([
    req('GET', '/api/matches?limit=6', { token }),
    req('GET', '/api/posts?limit=3', { token }),
    req('GET', '/api/sessions/mine', { token }),
    req('GET', '/api/notifications/unread-count', { token }),
    req('GET', '/api/auth/me', { token })
  ]);
  check('HOME /api/matches', home[0].status === 200, JSON.stringify(home[0].json).slice(0, 120));
  check('HOME /api/posts', home[1].status === 200, JSON.stringify(home[1].json).slice(0, 120));
  check('HOME /api/sessions/mine', home[2].status === 200, JSON.stringify(home[2].json).slice(0, 120));
  check('HOME /api/notifications/unread-count', home[3].status === 200);
  check('HOME /api/auth/me', home[4].status === 200);
  const posts = home[1].json.data.posts;
  const matches = home[0].json.data.matches;
  const sessions = home[2].json.data;

  // AI prompt
  const ai = await req('POST', '/api/ai', { token, body: { prompt: 'I need someone who can teach me React Saturday' } });
  check('HOME AI prompt', ai.status === 200 && ai.json.data.intent);

  // PROFILE (self)
  const self = await req('GET', `/api/users/${user._id}`, { token });
  check('PROFILE self', self.status === 200 && self.json.data.user);
  // PROFILE (other)
  if (matches[0]) {
    const other = await req('GET', `/api/users/${matches[0].user._id}`, { token });
    check('PROFILE other', other.status === 200 && other.json.data.user);
  }

  // EDIT PROFILE
  const ep = await req('PUT', '/api/users/me', { token, body: { bio: 'audit ok' } });
  check('EDIT PROFILE PUT /users/me', ep.status === 200);
  const addSkill = await req('POST', '/api/users/me/skills/teach', { token, body: { skill: { name: 'AuditSkill', category: 'Other', proficiency: 'beginner' } } });
  check('EDIT PROFILE add teach skill', addSkill.status === 200);
  const rmSkill = await req('DELETE', '/api/users/me/skills/teach/AuditSkill', { token });
  check('EDIT PROFILE remove teach skill', rmSkill.status === 200);
  const addLearn = await req('POST', '/api/users/me/skills/learn', { token, body: { skill: { name: 'AuditWant', category: 'Other', proficiency: 'beginner' } } });
  check('EDIT PROFILE add learn skill', addLearn.status === 200);
  const rmLearn = await req('DELETE', '/api/users/me/skills/learn/AuditWant', { token });
  check('EDIT PROFILE remove learn skill', rmLearn.status === 200);
  const av = await req('PUT', '/api/users/me/availability', { token, body: { slots: [{ day: 'Sun', start: '10:00', end: '12:00' }] } });
  check('EDIT PROFILE availability', av.status === 200);

  // MATCHES
  const mAll = await req('GET', '/api/matches', { token });
  check('MATCHES list', mAll.status === 200 && Array.isArray(mAll.json.data.matches));
  if (matches[0]) {
    const m1 = await req('GET', `/api/users/${matches[0].user._id}`, { token });
    check('MATCH DETAIL (other profile)', m1.status === 200);
  }

  // FEED
  const f1 = await req('GET', '/api/posts', { token });
  check('FEED all', f1.status === 200);
  const f2 = await req('GET', '/api/posts?intent=NEED_HELP', { token });
  check('FEED need-help filter', f2.status === 200);
  const f3 = await req('GET', '/api/posts?intent=OFFERING', { token });
  check('FEED offering filter', f3.status === 200);
  const f4 = await req('GET', '/api/posts?intent=PROJECT', { token });
  check('FEED project filter', f4.status === 200);
  if (posts[0]) {
    const pd = await req('GET', `/api/posts/${posts[0]._id}`, { token });
    check('POST DETAIL', pd.status === 200 && pd.json.data.post);
    const pl = await req('POST', `/api/posts/${posts[0]._id}/like`, { token });
    check('POST like', pl.status === 200);
    const pc = await req('POST', `/api/posts/${posts[0]._id}/comments`, { token, body: { text: 'audit' } });
    check('POST comment', pc.status === 201);
  }
  const fc = await req('POST', '/api/posts', { token, body: { intent: 'OFFERING', title: 'Audit post', body: 'test', tags: ['audit'] } });
  check('CREATE POST', fc.status === 201);

  // MESSAGES
  const convs = await req('GET', '/api/messages', { token });
  check('MESSAGES list', convs.status === 200 && Array.isArray(convs.json.data.conversations));
  if (matches[0]) {
    const cwith = await req('POST', `/api/messages/with/${matches[0].user._id}`, { token });
    check('CONVERSATION create-with', cwith.status === 201 && cwith.json.data.conversation);
    const cid = cwith.json.data.conversation._id;
    const cmsgs = await req('GET', `/api/messages/${cid}/messages`, { token });
    check('CONVERSATION messages', cmsgs.status === 200 && Array.isArray(cmsgs.json.data.messages));
    const csend = await req('POST', `/api/messages/${cid}/messages`, { token, body: { text: 'audit hello' } });
    check('CONVERSATION send', csend.status === 201);
    const cread = await req('POST', `/api/messages/${cid}/read`, { token });
    check('CONVERSATION read', cread.status === 200);
  }

  // MY MATCHES
  const sent = await req('GET', '/api/swap-requests/sent', { token });
  check('MY MATCHES sent', sent.status === 200);
  const recv = await req('GET', '/api/swap-requests/received', { token });
  check('MY MATCHES received', recv.status === 200);
  const sentList = sent.json.data.swapRequests;
  if (sentList[0]) {
    const sd = await req('GET', `/api/swap-requests/${sentList[0]._id}`, { token });
    check('SWAP detail', sd.status === 200 && sd.json.data.swapRequest);
  }

  // SESSIONS
  if (sessions.upcoming?.[0]) {
    const sId = sessions.upcoming[0]._id;
    const sd = await req('GET', `/api/sessions/session/${sId}`, { token });
    check('SESSION detail', sd.status === 200 && sd.json.data.session);
    const revs = await req('GET', `/api/sessions/session/${sId}/reviews`, { token });
    check('SESSION reviews', revs.status === 200);
  }

  // WISHLIST
  const wlist = await req('GET', '/api/help-requests?status=open', { token });
  check('WISHLIST list', wlist.status === 200 && Array.isArray(wlist.json.data.helpRequests));
  const wnew = await req('POST', '/api/help-requests', { token, body: { title: 'Audit wish', skillNeeded: 'Audit' } });
  check('WISHLIST create', wnew.status === 201);
  if (wlist.json.data.helpRequests[0]) {
    const wid = wlist.json.data.helpRequests[0]._id;
    const wd = await req('GET', `/api/help-requests/${wid}`, { token });
    check('WISHLIST detail', wd.status === 200);
  }

  // CREDITS
  const cr = await req('GET', '/api/credits/summary', { token });
  check('CREDITS summary', cr.status === 200);
  const ch = await req('GET', '/api/credits/history', { token });
  check('CREDITS history', ch.status === 200);

  // IMPACT
  const im = await req('GET', '/api/impact/me', { token });
  check('IMPACT', im.status === 200 && im.json.data.impact);

  // NOTIFICATIONS
  const no = await req('GET', '/api/notifications', { token });
  check('NOTIFICATIONS list', no.status === 200 && Array.isArray(no.json.data.notifications));
  const notif = no.json.data.notifications[0];
  if (notif) {
    const nr = await req('POST', `/api/notifications/${notif._id}/read`, { token });
    check('NOTIFICATION read', nr.status === 200);
  }
  const nall = await req('POST', '/api/notifications/read-all', { token });
  check('NOTIFICATION read-all', nall.status === 200);

  // UPLOADS (Cloudinary configured)
  const sig = await req('POST', '/api/uploads/signature', { token, body: {} });
  check('UPLOADS signature', sig.status === 200 && sig.json.data.signature);

  // CLOUDINARY SIGNED UPLOAD FROM BROWSER (we can't browser-test from here, but verify signature shape)
  check('UPLOADS signature has cloudName', sig.json?.data?.cloudName === 'dvdf6c1vv');
  check('UPLOADS signature has apiKey', !!sig.json?.data?.apiKey);

  // Logout
  const lo = await req('POST', '/api/auth/logout', { token });
  check('LOGOUT', lo.status === 200);

  console.log(`\n${pass} pass / ${fail} fail`);
  if (fail) {
    console.log('\nFailures:');
    for (const i of issues) console.log('  -', i.label, i.detail || '');
    process.exit(1);
  }
}

main().catch((e) => { console.error('ERR', e); process.exit(1); });
