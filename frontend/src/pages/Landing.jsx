import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeftRight, BookOpenCheck, CalendarCheck2, HandCoins, MessagesSquare, Sparkles, ShieldCheck } from 'lucide-react';

// Public marketing landing page. Shown to logged-out users at `/welcome`
// and at `/`. No auth required. Pure monochrome — matches the rest of the app.

const FEATURES = [
  {
    icon: ArrowLeftRight,
    title: 'Two-way swaps',
    body: 'Teach what you know, learn what you need. Reciprocal matches show up ranked by skill overlap, availability, and trust.'
  },
  {
    icon: HandCoins,
    title: 'Time Credits, not money',
    body: 'Every verified session settles one credit to the teacher, one credit from the learner. Your balance is your commitment, not your wallet.'
  },
  {
    icon: MessagesSquare,
    title: 'Real chat + OTP verify',
    body: 'A 4-digit code generated when the session starts means both sides have to show up. No ghosting, no fake ratings.'
  },
  {
    icon: Sparkles,
    title: 'AI Discover',
    body: 'Type a sentence like "I want to learn React Saturday evening" — we extract the skills and time hint, and rank peers for you.'
  },
  {
    icon: CalendarCheck2,
    title: 'Schedule + reminders',
    body: 'Propose times, accept, get a session in My Matches. The dashboard nudges both sides 6 hours before the start.'
  },
  {
    icon: ShieldCheck,
    title: 'Trust score & badges',
    body: 'Helpers, Mentors, Top Rated — earned by showing up. Trust score factors into match ranking so you find reliable peers.'
  },
];

const DEMO_ACCOUNTS = [
  { email: 'aarav.sharma@anurag.edu.in',  note: 'React, Node.js' },
  { email: 'diya.reddy@anurag.edu.in',    note: 'Figma, UI Design' },
  { email: 'arjun.mehta@anurag.edu.in',   note: 'System Design mentor' },
];

function Brand() {
  return (
    <Link to="/welcome" className="inline-flex items-center gap-2 font-bold tracking-tight text-ink-900">
      <BrandMark className="h-8 w-8" />
      <span className="text-lg">Skill Swap</span>
    </Link>
  );
}

export function BrandMark({ className = 'h-8 w-8' }) {
  // Hand-built SVG mark — two interlocking loops, monochrome, no gradient.
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-ink-900" />
      <path
        d="M9 16h7a4 4 0 0 1 0 8h-3M23 16h-7a4 4 0 0 0 0 8h3"
        stroke="#f6f6f5" strokeWidth="2.2" strokeLinecap="round" fill="none"
      />
    </svg>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-ink-50 text-ink-900">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-ink-200 bg-ink-50/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Brand />
          <nav className="hidden items-center gap-6 text-sm sm:flex">
            <a href="#how" className="text-ink-700 hover:text-ink-900">How it works</a>
            <a href="#features" className="text-ink-700 hover:text-ink-900">Features</a>
            <a href="#demo" className="text-ink-700 hover:text-ink-900">Demo accounts</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn-secondary">Sign in</Link>
            <Link to="/register" className="btn-primary">Get started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-20 sm:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="chip-ink">Anurag University · pilot</span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Teach what you know.<br />Learn what you need.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-700">
              Skill Swap is a peer-to-peer campus skill exchange for Anurag students.
              You earn <b>Time Credits</b> by teaching and spend them on sessions with people
              who already walk the same corridors.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to="/register" className="btn-primary">
                Create your profile <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className="btn-secondary">I have an account</Link>
            </div>
            <p className="mt-3 text-xs text-ink-500">
              Restricted to <code className="rounded bg-ink-100 px-1 py-0.5">@anurag.edu.in</code> emails · 100+ students seeded for the demo
            </p>
          </div>

          {/* Hero card stack */}
          <div className="relative">
            <div className="card relative overflow-hidden">
              <div className="flex items-center gap-3 border-b border-ink-200 pb-3">
                <BrandMark className="h-7 w-7" />
                <div>
                  <div className="text-sm font-semibold">Aarav Sharma</div>
                  <div className="text-xs muted">CSE · 3rd Year · trust 82</div>
                </div>
                <span className="ml-auto chip">React · Node.js</span>
              </div>
              <div className="space-y-3 pt-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-full border border-ink-200">
                    <BookOpenCheck className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">Teach: React + Node.js</div>
                    <div className="muted">Sat 10–13, Mon 18–20</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-full border border-ink-200">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">Learn: Figma</div>
                    <div className="muted">Matched with Diya (reciprocal swap)</div>
                  </div>
                </div>
                <div className="rounded-lg border border-ink-200 bg-ink-50 p-3 text-xs">
                  <span className="font-mono">AI:</span> <i>"I want to learn React Saturday evening"</i>
                  <div className="muted mt-1">→ 9 ranked peers, top match: Diya Reddy</div>
                </div>
              </div>
            </div>
            <div className="card mt-3 hidden max-w-xs sm:block">
              <div className="text-xs muted">Incoming swap</div>
              <div className="text-sm font-medium">Figma ↔ React · with Diya</div>
              <div className="mt-2 flex gap-2">
                <button className="btn-primary text-xs">Accept</button>
                <button className="btn-secondary text-xs">Reschedule</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-ink-200 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="section-title">How a swap works</h2>
          <p className="mt-2 max-w-2xl text-ink-700">From a profile to a verified session in five steps.</p>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { n: '01', t: 'Profile', d: 'Add skills you teach, skills you want, and weekly availability.' },
              { n: '02', t: 'Discover', d: 'Browse ranked peers or ask AI Discover in plain English.' },
              { n: '03', t: 'Propose', d: 'Send a swap request with a time. Recipient accepts and the session is scheduled.' },
              { n: '04', t: 'Verify', d: 'At session start, teacher issues a 4-digit code. Both confirm; credits settle.' },
              { n: '05', t: 'Rate', d: 'Both rate each other. Trust score, badges and match ranking update.' },
            ].map((s) => (
              <li key={s.n} className="card">
                <div className="font-mono text-xs text-ink-500">{s.n}</div>
                <div className="mt-1 text-base font-semibold">{s.t}</div>
                <p className="mt-1 text-sm text-ink-700">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="section-title">Everything the app does</h2>
          <p className="mt-2 max-w-2xl text-ink-700">No payments. No platform fees. No cold DMs. Just students helping students.</p>
          <div className="mt-10 grid-cards">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="card">
                  <div className="grid h-10 w-10 place-items-center rounded-lg border border-ink-200 bg-ink-50">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mt-3 text-base font-semibold">{f.title}</div>
                  <p className="mt-1 text-sm text-ink-700">{f.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Demo accounts */}
      <section id="demo" className="border-t border-ink-200 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="section-title">Try it now — no signup needed</h2>
          <p className="mt-2 max-w-2xl text-ink-700">
            The demo is seeded with 100 students, 65 posts, 123 swap requests and a few in-progress sessions.
            Sign in as any of these to see a fully populated profile.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {DEMO_ACCOUNTS.map((a) => (
              <Link key={a.email} to="/login" className="card hover:border-ink-800">
                <div className="text-xs muted">Demo account</div>
                <div className="mt-1 text-sm font-mono break-all">{a.email}</div>
                <div className="mt-2 text-xs text-ink-700">{a.note}</div>
                <div className="mt-3 text-xs font-semibold text-ink-900">password123</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink-200 bg-ink-50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm sm:flex-row">
          <div className="flex items-center gap-2 text-ink-700">
            <BrandMark className="h-6 w-6" />
            <span>Skill Swap · Anurag University</span>
          </div>
          <div className="text-xs muted">Built for the campus. Open source.</div>
        </div>
      </footer>
    </div>
  );
}
