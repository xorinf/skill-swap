import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../lib/api.js';
import { useAuth } from '../state/AuthContext.jsx';
import { Avatar, Chip, Section, Empty, TrustBadge, relativeTime } from '../components/ui.jsx';
import { Sparkles, ArrowRight, Rocket, UserPlus } from 'lucide-react';

export default function Home() {
  const api = useApi();
  const { user } = useAuth();
  const [recs, setRecs] = useState([]);
  const [allPeers, setAllPeers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return; // wait until AuthContext has a user
    api.get('/matches?limit=6').then((r) => setRecs(r.data.matches)).catch(() => {});
    // Fallback for new users with no skill overlap: list recent active peers
    api.get('/users?limit=8').then((r) => setAllPeers(r.data.users || [])).catch(() => {});
    api.get('/posts?limit=3').then((r) => setPosts(r.data.posts)).catch(() => {});
    api.get('/sessions/mine').then((r) => setUpcoming(r.data.upcoming)).catch(() => {});
    api.get('/notifications/unread-count').then((r) => setUnread(r.data.count)).catch(() => {});
  }, [api, user]);

  const isNew = !user?.skillsCanTeach?.length && !user?.skillsToLearn?.length;

  return (
    <div className="space-y-8">
      {isNew && <OnboardingCard />}

      {/* AI TEASER — links out to the dedicated page */}
      <section className="card border-ink-300 bg-gradient-to-br from-ink-50 to-white">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-ink-900 text-ink-50">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h1 className="section-title">Hey {user?.name?.split(' ')[0]}, who do you want to learn from?</h1>
            <p className="muted mt-1 text-sm">
              Describe what you need in plain English. We'll extract the intent, then rank the best peers on campus.
            </p>
          </div>
          <Link to="/discover/ai" className="btn-primary sm:self-center">
            <Sparkles className="h-4 w-4" /> Open AI Discover
          </Link>
        </div>
      </section>

      {/* RECOMMENDED PEERS — match-engine first, fall back to recent active peers */}
      <Section
        title={recs.length > 0 ? 'Recommended peers' : 'People on campus'}
        action={<Link to="/matches" className="text-sm muted hover:text-ink-900">See all people →</Link>}
      >
        {recs.length > 0 ? (
          <div className="grid-cards">
            {recs.map((m) => <MatchCard key={m.user._id} m={m} />)}
          </div>
        ) : allPeers.length > 0 ? (
          <>
            <div className="muted mb-3 text-sm">No skill overlap yet. Browse recent active students below — add skills to your profile to get personalised recommendations.</div>
            <div className="grid-cards">
              {allPeers.slice(0, 6).map((u) => <PeerCard key={u._id} user={u} />)}
            </div>
          </>
        ) : (
          <Empty title="No peers yet" body="Be the first to add skills to your profile." action={<Link to="/profile/edit" className="btn-primary">Edit profile</Link>} />
        )}
      </Section>

      {/* CAMPUS PULSE */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Section title="Upcoming sessions" >
          {upcoming.length === 0 ? <Empty title="No upcoming sessions" body="Send a swap request to schedule one." /> : (
            <div className="space-y-2">
              {upcoming.slice(0, 3).map((s) => (
                <Link to={`/sessions/${s._id}`} key={s._id} className="card flex items-center justify-between gap-3 hover:border-ink-300">
                  <div className="flex items-center gap-3">
                    <Avatar user={s.teacher._id === user?._id ? s.learner : s.teacher} size={36} />
                    <div>
                      <div className="text-sm font-semibold">{s.teachSkill} ↔ {s.learnSkill}</div>
                      <div className="muted text-xs">{new Date(s.scheduledStart).toLocaleString()}</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-ink-400" />
                </Link>
              ))}
            </div>
          )}
        </Section>

        <Section title="Campus feed" action={<Link to="/feed" className="text-sm muted hover:text-ink-900">Open →</Link>}>
          {posts.length === 0 ? <Empty title="Quiet feed" body="Be the first to post." action={<Link to="/feed/new" className="btn-primary">+ Post</Link>} /> : (
            <div className="space-y-2">
              {posts.map((p) => (
                <Link to={`/feed/${p._id}`} key={p._id} className="card block hover:border-ink-300">
                  <div className="flex items-center justify-between">
                    <div className="text-xs muted">{p.intent.replace('_', ' ')}</div>
                    <div className="text-xs muted">{relativeTime(p.createdAt)}</div>
                  </div>
                  <div className="mt-1 text-sm font-semibold line-clamp-2">{p.title}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <Avatar user={p.author} size={20} />
                    <span className="text-xs muted">{p.author.name}{p.author.department ? ` · ${p.author.department}` : ''}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Section>

        <Section title="Activity" action={<Link to="/notifications" className="text-sm muted hover:text-ink-900">All →</Link>}>
          <div className="card">
            <div className="text-sm">You have <b>{unread}</b> unread notification{unread === 1 ? '' : 's'}.</div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <Link to="/wishlist/new" className="btn-secondary">+ Wishlist</Link>
              <Link to="/feed/new" className="btn-secondary">+ Post</Link>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

function OnboardingCard() {
  return (
    <section className="card border-ink-300 bg-gradient-to-br from-ink-50 to-white">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-ink-900 text-ink-50">
          <Rocket className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold">Welcome. Two minutes to get useful results.</h2>
          <p className="muted mt-1 text-sm">
            Add a few skills you can teach and a few you want to learn. The match engine needs them to find people for you.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Link to="/profile/edit" className="btn-primary justify-center">
          <UserPlus className="h-4 w-4" />1. Edit profile
        </Link>
        <Link to="/profile/edit" className="btn-secondary justify-center">2. Add skills</Link>
        <Link to="/discover/ai" className="btn-secondary justify-center">3. Try AI Discover</Link>
      </div>
    </section>
  );
}

function MatchCard({ m, compact = false, onMessage }) {
  const { user, match, explanation } = m;
  return (
    <div className="card block hover:border-ink-300">
      <Link to={`/matches/${user._id}`} className="flex items-start gap-3">
        <Avatar user={user} size={48} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate text-base font-semibold">{user.name}</div>
            <div className="rounded-full border border-ink-800 px-2 py-0.5 text-xs font-semibold">{match.score}%</div>
          </div>
          <div className="muted truncate text-xs">{user.department || 'Anurag University'}{user.year ? ` · ${user.year}` : ''}</div>
        </div>
      </Link>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {user.skillsCanTeach.slice(0, 3).map((s) => <Chip key={s.name}>teaches {s.name}</Chip>)}
        {user.skillsToLearn.slice(0, 2).map((s) => <Chip key={s.name}>wants {s.name}</Chip>)}
      </div>
      {explanation && (
        <p className="mt-3 rounded-lg border border-ink-200 bg-ink-50 p-2 text-xs leading-relaxed text-ink-700">{explanation}</p>
      )}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs muted">
          <TrustBadge score={user.trustScore} />
          <span>{match.reasons.reciprocal ? 'Reciprocal match' : 'One-way match'}</span>
        </div>
        <div className="flex gap-2">
          <Link to={`/matches/${user._id}`} className="btn-secondary">View</Link>
          {onMessage && (
            <button onClick={() => onMessage(user)} className="btn-primary">Message</button>
          )}
        </div>
      </div>
    </div>
  );
}

// Light card for "browse recent active peers" — no match score, just a person.
function PeerCard({ user }) {
  return (
    <Link to={`/matches/${user._id}`} className="card block hover:border-ink-300">
      <div className="flex items-start gap-3">
        <Avatar user={user} size={48} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-semibold">{user.name}</div>
          <div className="muted truncate text-xs">{user.department || 'Anurag University'}{user.year ? ` · ${user.year}` : ''}</div>
        </div>
        <TrustBadge score={user.trustScore} />
      </div>
      {user.bio && <p className="mt-2 line-clamp-2 text-xs muted">{user.bio}</p>}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {user.skillsCanTeach?.slice(0, 3).map((s) => <Chip key={s.name}>teaches {s.name}</Chip>)}
      </div>
    </Link>
  );
}
