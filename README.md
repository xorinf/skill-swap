# Skill Swap — Anurag University

Peer-to-peer campus skill exchange: students teach, learn, chat, schedule, verify and rate each other, all powered by non-monetary Time Credits and an AI-assisted people finder.

## Stack (strictly MERN, separated)

- **Frontend** — React 18 + Vite + Tailwind CSS in `frontend/`
- **Backend** — Node 22 + Express 5 (ESM) in `backend/`
- **Database** — MongoDB via Mongoose
- **Real-time** — Socket.IO (chat, presence, notifications, session OTP events)
- **Media** — Cloudinary (profile photos, feed images, PDF / file attachments)
- **AI** — Provider-agnostic (OpenAI or Anthropic). Falls back to a deterministic heuristic if no API key is set.

The two projects are **physically separate**, communicate only through REST (`/api/*`) and Socket.IO, and never share modules.

```
skill-swap/
├── backend/      # Node + Express API + Socket.IO server
│   ├── src/
│   │   ├── config/         # env, db, cloudinary
│   │   ├── middleware/     # auth, error, validate
│   │   ├── models/         # mongoose schemas
│   │   ├── modules/        # one folder per feature: auth, users, matches, …
│   │   ├── services/       # match, credit, trust, ai, notify, chat
│   │   ├── sockets/        # socket.io setup
│   │   ├── utils/          # constants, response, seed
│   │   ├── app.js
│   │   └── server.js
│   ├── scripts/smoke.mjs       # end-to-end happy-path smoke
│   └── scripts/integration.mjs # every-route integration
└── frontend/     # React SPA
    ├── src/
    │   ├── pages/         # one file per route
    │   ├── components/    # Shell, Toaster, ui primitives
    │   ├── state/         # AuthContext, SocketContext
    │   ├── lib/           # api wrapper
    │   └── App.jsx
    └── vite.config.js     # dev proxy → :5050
```

## Run locally

```bash
# 1) MongoDB
mongod --dbpath .mongo-data --port 27018          # any port not in use; update .env if not 27018

# 2) Backend
cd backend
cp .env.example .env                               # edit if needed
npm install
npm run seed                                       # 6 demo students + posts + 1 pending swap
npm run dev                                        # http://localhost:5050

# 3) Frontend (new terminal)
cd frontend
npm install
npm run dev                                        # http://localhost:5173
```

Open http://localhost:5173 and sign in with any seeded account (password `password123`):

| aarav.sharma@anurag.edu.in | React, Node.js (has incoming swap, upcoming session) |
| diya.reddy@anurag.edu.in | Figma, UI Design |
| arjun.mehta@anurag.edu.in | System Design, DSA (mentor) |
| rohan.patel@anurag.edu.in | Python, ML |
| karthik.nair@anurag.edu.in | DSA |
| priya.verma@anurag.edu.in | CSS, Tailwind |
| devansh.pillai@anurag.edu.in | React, Node (open-source) |
| rahul.khanna@anurag.edu.in | System Design, Interview prep |
| pooja.reddy@anurag.edu.in | Public speaking, resume review |

All 20 accounts use `firstname.lastname@anurag.edu.in`, password `password123`.

## End-to-end happy path (matches the demo script)

1. **Register / login** with `@anurag.edu.in` (other domains are rejected).
2. **Profile** → add skills to teach, skills to learn, weekly availability slots.
3. **Home** → type a natural-language prompt like *"I need someone who can teach me React and is free Saturday evening"*. The AI extracts intent, the matching engine returns ranked peers.
4. **Match detail** → send a swap request with a proposed time.
5. Recipient **accepts** → a `Session` is created and a conversation opens with context.
6. **Chat** in real time (Socket.IO). Send text, share an image / PDF via Cloudinary.
7. **My Matches** → open the session.
8. **Start** the session, **issue** a 4-digit OTP. The other participant enters it; both must confirm.
9. Session is **verified** → credits settle (+1 to teacher, −1 to learner) atomically with a transaction record.
10. Both **rate** the session. **Trust score** and **badges** update.
11. **Impact dashboard** reflects the new numbers.

## API surface (one route file per feature)

| Route | Purpose |
| --- | --- |
| `POST /api/auth/register` `POST /api/auth/login` `POST /api/auth/logout` `GET /api/auth/me` | JWT in httpOnly cookie + Bearer fallback |
| `GET /api/users` `GET /api/users/:id` `PUT /api/users/me` `POST /api/users/me/skills/{teach,learn}` `DELETE /api/users/me/skills/{teach,learn}/:name` `PUT /api/users/me/availability` `POST /api/users/me/photo` | Profile + skills + availability |
| `GET /api/matches` | Ranked peer recommendations |
| `POST /api/ai` | Natural-language → intent → matching |
| `POST /api/swap-requests` `GET /api/swap-requests/{sent,received}` `GET /api/swap-requests/:id` `POST /:id/{accept,reject,cancel,reschedule}` | Swap lifecycle |
| `GET /api/posts` `POST /api/posts` `GET /api/posts/:id` `POST /:id/{like,comments}` | Feed |
| `GET /api/help-requests` `POST /api/help-requests` `GET /api/help-requests/:id` `POST /:id/offer` | Wishlist / structured help requests |
| `GET /api/messages` `POST /api/messages/with/:userId` `GET /api/messages/:id/messages` `POST /api/messages/:id/messages` `POST /api/messages/:id/read` | Chat (REST; Socket.IO delivers in real time) |
| `GET /api/sessions/mine` `GET /api/sessions/session/:id` `POST /:id/start` `POST /:id/issue-otp` `POST /:id/verify-otp` `POST /:id/review` | Sessions, OTP, ratings |
| `GET /api/credits/{summary,history}` | Time-credit balance and transactions |
| `GET /api/notifications` `POST /api/notifications/:id/read` `POST /api/notifications/read-all` `GET /api/notifications/unread-count` | Notifications |
| `GET /api/impact/me` | Student impact dashboard |
| `POST /api/uploads/signature` `POST /api/uploads/upload` | Cloudinary signed + direct upload |

## Environment variables

`backend/.env`:

```
PORT=5050
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27018/skillswap
JWT_SECRET=change-me
JWT_EXPIRES=7d
ALLOWED_EMAIL_DOMAIN=anurag.edu.in
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=skillswap
AI_PROVIDER=none               # openai | openai_compat | anthropic | none
AI_API_KEY=
AI_MODEL=
```

`frontend/.env` is optional — Vite proxies `/api` and `/socket.io` to `localhost:5050` by default.

## Tests

```bash
cd backend
node scripts/smoke.mjs         # 30 assertions on the full happy path
node scripts/integration.mjs   # 25 assertions across every route
```

Both run against a live server + MongoDB. The smoke covers: register → match → AI prompt → swap request → accept → chat → start → OTP → verify → credits → review → feed → socket.

## Notes on the AI service

`AI_PROVIDER=none` keeps the app fully functional: the prompt parser uses a deterministic keyword + regex heuristic that recognises ~50 common skills and time hints. Setting `AI_PROVIDER=openai` (or `openai_compat` / `anthropic`) and `AI_API_KEY` switches it to a real LLM. The matching engine is always deterministic and only ever returns real MongoDB users — the AI only structures the query, never invents profiles.

## Architectural rules (followed)

- Frontend never imports mongoose / never talks to MongoDB. All writes go through the API.
- Secrets (JWT, Cloudinary, AI) live in `backend/.env` only; React never sees them.
- Each feature has its own `*.routes.js` + `*.controller.js` (or in this MVP, single-file modules for brevity, see `modules/<feature>/`).
- Controllers stay thin; complex logic lives in `services/`.
- Errors flow through a single middleware that maps `ApiError`, Zod, Mongoose validation, JWT, and duplicate-key to the right HTTP code.

## MongoDB data model (one collection per concern)

- `users` — credentials, skills (subdocs), availability, credits, trust
- `posts` + `comments` — feed
- `swaps` (swap requests) — request lifecycle
- `sessions` — scheduled + verified meetings with OTP
- `reviews` — unique per (session, rater)
- `credittxns` — append-only credit transaction history
- `conversations` + `messages` — chat
- `helprequests` — wishlist
- `notifications` — feed of in-app events

## License

MIT — built for a hackathon MVP.
