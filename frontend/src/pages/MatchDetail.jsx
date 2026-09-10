import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../lib/api.js';
import { useAuth } from '../state/AuthContext.jsx';
import { Avatar, Chip, TrustBadge, Empty } from '../components/ui.jsx';
import { toast } from '../components/Toaster.jsx';
import { ArrowLeft, Send, MessageCircle } from 'lucide-react';
import { Spinner, PageError } from '../components/PageHeader.jsx';

export default function MatchDetail() {
  const { user: me } = useAuth();
  const { userId } = useParams();
  const api = useApi();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState('');
  const [when, setWhen] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([api.get(`/users/${userId}`), api.get(`/matches?limit=50`)])
      .then(([u, m]) => {
        const their = m.data.matches.find((x) => x.user._id === userId);
        setData({ user: u.data.user, match: their?.match || null });
      })
      .catch(() => setData({ user: null, match: null, missing: true }));
  }, [userId, api]);

  if (data?.missing) return <PageError title="Couldn't load this profile" body="The user may have been removed." />;
  if (!data) return <Spinner label="Loading match…" />;
  const { user, match } = data;

  const send = async () => {
    if (!when) { toast.error('Pick a proposed time'); return; }
    setBusy(true);
    try {
      const start = new Date(when);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const r = await api.post('/swap-requests', {
        recipient: user._id,
        teachSkill: match?.reasons?.bWantsMine?.[0] || me.skillsCanTeach?.[0]?.name || 'a skill',
        learnSkill: match?.reasons?.aWantsMine?.[0] || user.skillsCanTeach?.[0]?.name || 'a skill',
        message: msg,
        proposedTimes: [{ start: start.toISOString(), end: end.toISOString() }]
      });
      toast.success('Request sent');
      nav('/my-matches');
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const openChat = async () => {
    const r = await api.post(`/messages/with/${user._id}`, {});
    nav(`/messages/${r.data.conversation._id}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => nav(-1)} className="row text-sm muted hover:text-ink-900"><ArrowLeft className="h-4 w-4" /> Back</button>
        <Link to={`/messages/with/${user._id}`} onClick={(e) => { e.preventDefault(); openChat(); }} className="row text-sm muted hover:text-ink-900">
          <MessageCircle className="h-4 w-4" /> Message
        </Link>
      </div>
      <div className="card">
        <div className="flex items-start gap-4">
          <Avatar user={user} size={72} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="section-title">{user.name}</h1>
              <TrustBadge score={user.trustScore} />
              {match && <span className="rounded-full border border-ink-800 px-2 py-0.5 text-xs font-semibold">{match.score}% match</span>}
            </div>
            <div className="muted text-sm">{user.department}{user.year ? ` · ${user.year}` : ''}</div>
            <p className="mt-2 text-sm">{user.bio || 'No bio yet.'}</p>
          </div>
        </div>
        {match?.reasons && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {match.reasons.aWantsMine?.length > 0 && (
              <div className="rounded-lg border border-ink-200 p-3 text-sm">
                <b>You can teach them:</b> {match.reasons.aWantsMine.join(', ')}
              </div>
            )}
            {match.reasons.bWantsMine?.length > 0 && (
              <div className="rounded-lg border border-ink-200 p-3 text-sm">
                <b>They can teach you:</b> {match.reasons.bWantsMine.join(', ')}
              </div>
            )}
            <div className="rounded-lg border border-ink-200 p-3 text-sm">
              <b>Availability overlap:</b> {match.reasons.availabilityOverlap ? 'Yes' : 'None yet'}
            </div>
            <div className="rounded-lg border border-ink-200 p-3 text-sm">
              <b>Reciprocal:</b> {match.reasons.reciprocal ? 'Yes — best fit' : 'One-way'}
            </div>
          </div>
        )}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <div className="label">Teaches</div>
            <div className="flex flex-wrap gap-2">
              {user.skillsCanTeach.length === 0 ? <Empty title="Nothing yet" body="" /> : user.skillsCanTeach.map((s) => <Chip key={s.name} kind="ink">{s.name}</Chip>)}
            </div>
          </div>
          <div>
            <div className="label">Wants to learn</div>
            <div className="flex flex-wrap gap-2">
              {user.skillsToLearn.map((s) => <Chip key={s.name}>{s.name}</Chip>)}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold">Send a swap request</h2>
        <p className="muted text-sm">Pick a time you can both commit to. They'll see this as a pending request.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <label className="label">Proposed start</label>
            <input type="datetime-local" className="input" value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>
          <div>
            <label className="label">Message (optional)</label>
            <input className="input" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Hi! Could we swap React ↔ Figma this weekend?" />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button onClick={send} disabled={busy} className="btn-primary"><Send className="h-4 w-4" /> {busy ? 'Sending…' : 'Send request'}</button>
        </div>
      </div>
    </div>
  );
}
