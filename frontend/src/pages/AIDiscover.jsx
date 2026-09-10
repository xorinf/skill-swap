import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../lib/api.js';
import { useAuth } from '../state/AuthContext.jsx';
import { Avatar, Chip, Section, Empty, TrustBadge } from '../components/ui.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { Sparkles, Send, MessageCircle, ArrowLeft } from 'lucide-react';
import { toast } from '../components/Toaster.jsx';

const SUGGESTED_PROMPTS = [
  'I need someone who can teach me React and is free Saturday evening',
  'I want to learn Figma and I can teach Python in return',
  'Find someone who knows DSA and can help me tomorrow after 5 PM',
  'Help me find a Python mentor for my ML project'
];

export default function AIDiscover() {
  const api = useApi();
  const { user } = useAuth();
  const nav = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [results, setResults] = useState(null);
  const [intent, setIntent] = useState(null);
  const [reply, setReply] = useState(null);
  const [busy, setBusy] = useState(false);

  const ask = async (text) => {
    const q = (text ?? prompt).trim();
    if (q.length < 1) return;
    setBusy(true);
    try {
      const r = await api.post('/ai', { prompt: q });
      setResults(r.data.matches);
      setIntent(r.data.intent);
      setPrompt(q);
      setReply(r.data.reply || null);
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const messagePeer = async (peer) => {
    try {
      const r = await api.post(`/messages/with/${peer._id}`, {});
      nav(`/messages/${r.data.conversation._id}`);
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <button onClick={() => nav(-1)} className="row text-sm muted hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <PageHeader
        title="AI Discover"
        subtitle="Tell us what you need. We'll parse the intent and rank the best peers on campus."
      />

      <section className="card border-ink-300 bg-gradient-to-br from-ink-50 to-white">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-ink-900 text-ink-50">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h1 className="section-title">Hey {user?.name?.split(' ')[0]}, who do you want to learn from?</h1>
            <p className="muted mt-1 text-sm">
              Describe what you need in plain English. We'll extract the skills, day, and intent — then rank real Anurag students.
            </p>
          </div>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); ask(); }} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            className="input flex-1 text-base"
            placeholder='e.g. "I need someone who can teach me React and is free Saturday evening"'
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            autoFocus
          />
          <button type="submit" disabled={busy} className="btn-primary sm:w-36">
            <Send className="h-4 w-4" /> {busy ? 'Thinking…' : 'Find people'}
          </button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.map((s) => (
            <button key={s} onClick={() => ask(s)} className="chip hover:bg-ink-100">{s}</button>
          ))}
        </div>
      </section>

      {!results && !intent && !reply && (
        <Empty
          title="Ask away"
          body="Type a prompt above or tap one of the suggestions. Results appear here, ranked and explained."
        />
      )}

      {intent && (
        <div className="card flex flex-wrap items-center gap-2 text-xs">
          <span className="muted">AI detected:</span>
          {intent.skills?.length > 0 && intent.skills.map((s) => <Chip key={s} kind="ink">{s}</Chip>)}
          {intent.intent && <Chip>intent: {intent.intent}</Chip>}
          {intent.availability?.day && (
            <Chip>
              when: {intent.availability.day}
              {intent.availability.time ? ' ' + intent.availability.time : ''}
            </Chip>
          )}
          <span className="muted">via {intent.provider || 'fallback'}</span>
        </div>
      )}

      {reply && (
        <div className="card border-ink-300 bg-white">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink-900 text-ink-50">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">AI assistant</div>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">{reply}</p>
            </div>
          </div>
        </div>
      )}

      {results && results.length > 0 && (
        <Section
          title={`Top ${results.length} matches for "${prompt}"`}
          action={
            <Link to="/matches" className="text-sm muted hover:text-ink-900">
              Browse all people →
            </Link>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            {results.map((m) => (
              <MatchCard key={m.user._id} m={m} onMessage={messagePeer} />
            ))}
          </div>
        </Section>
      )}

      {results && results.length === 0 && !reply && (
        <Empty
          title="No matches yet"
          body="Try a different skill — or add skills to your profile to unlock more matches."
          action={<Link to="/profile/edit" className="btn-primary">Add skills</Link>}
        />
      )}
    </div>
  );
}

function MatchCard({ m, onMessage }) {
  const { user, match, explanation } = m;
  return (
    <div className="card hover:border-ink-300">
      <Link to={`/matches/${user._id}`} className="flex items-start gap-3">
        <Avatar user={user} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate text-base font-semibold">{user.name}</div>
            <div className="rounded-full border border-ink-800 px-2 py-0.5 text-xs font-semibold">
              {match.score}%
            </div>
          </div>
          <div className="muted truncate text-xs">
            {user.department || 'Anurag University'}{user.year ? ` · ${user.year}` : ''}
          </div>
        </div>
      </Link>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {user.skillsCanTeach.slice(0, 3).map((s) => (
          <Chip key={s.name}>teaches {s.name}</Chip>
        ))}
        {user.skillsToLearn.slice(0, 2).map((s) => (
          <Chip key={s.name}>wants {s.name}</Chip>
        ))}
      </div>

      {explanation && (
        <p className="mt-3 rounded-lg border border-ink-200 bg-ink-50 p-3 text-xs leading-relaxed text-ink-700">
          <span className="font-semibold">Why: </span>
          {explanation}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs muted">
          <TrustBadge score={user.trustScore} />
          <span>{match.reasons.reciprocal ? 'Reciprocal match' : 'One-way match'}</span>
        </div>
        <div className="flex gap-2">
          <Link to={`/matches/${user._id}`} className="btn-secondary">View</Link>
          <button onClick={() => onMessage(user)} className="btn-primary">
            <MessageCircle className="h-4 w-4" /> Message
          </button>
        </div>
      </div>
    </div>
  );
}
