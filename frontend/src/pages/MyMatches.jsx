import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../lib/api.js';
import { useAuth } from '../state/AuthContext.jsx';
import { Avatar, Chip, Empty, Section, relativeTime } from '../components/ui.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { toast } from '../components/Toaster.jsx';
import { Check, X, MessageCircle } from 'lucide-react';

function RequestRow({ sr, side, onChange }) {
  const other = side === 'sent' ? sr.recipient : sr.requester;
  const nav = useNavigate();
  const api = useApi();
  const [busy, setBusy] = useState(false);

  const accept = async () => {
    setBusy(true);
    try {
      // Use the first proposed time as the agreed time
      const t = sr.proposedTimes?.[0];
      if (!t) { toast.error('No proposed time'); return; }
      await api.post(`/swap-requests/${sr._id}/accept`, { proposedTime: { start: t.start, end: t.end } });
      toast.success('Accepted');
      onChange();
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };
  const reject = async () => { await api.post(`/swap-requests/${sr._id}/reject`, {}); toast.info('Rejected'); onChange(); };
  const cancel = async () => { await api.post(`/swap-requests/${sr._id}/cancel`, {}); toast.info('Cancelled'); onChange(); };

  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <Avatar user={other} size={42} />
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-semibold">{other?.name || 'Unknown'}</div>
            <Chip kind={sr.status === 'pending' ? 'ink' : 'default'}>{sr.status}</Chip>
          </div>
          <div className="text-xs muted">Swap {sr.teachSkill} ↔ {sr.learnSkill}</div>
          {sr.message && <p className="mt-2 text-sm">{sr.message}</p>}
          {sr.proposedTimes?.length > 0 && (
            <div className="mt-2 text-xs muted">Proposed: {sr.proposedTimes.map((t) => new Date(t.start).toLocaleString()).join(', ')}</div>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {sr.session && <Link to={`/sessions/${sr.session._id || sr.session}`} className="btn-primary">Open session</Link>}
        {side === 'received' && sr.status === 'pending' && (
          <>
            <button onClick={accept} disabled={busy} className="btn-primary"><Check className="h-4 w-4" /> Accept</button>
            <button onClick={reject} className="btn-secondary"><X className="h-4 w-4" /> Decline</button>
          </>
        )}
        {['pending', 'scheduled', 'reschedule_requested'].includes(sr.status) && (
          <button onClick={cancel} className="btn-secondary">Cancel</button>
        )}
        <button onClick={() => nav(`/messages/with/${other?._id}`)} className="btn-secondary"><MessageCircle className="h-4 w-4" />Message</button>
      </div>
    </div>
  );
}

export default function MyMatches() {
  const api = useApi();
  const { user: me } = useAuth();
  const [tab, setTab] = useState('upcoming');
  const [sent, setSent] = useState([]);
  const [received, setReceived] = useState([]);
  const [sessions, setSessions] = useState({ upcoming: [], past: [] });

  const load = async () => {
    const [s, r, m] = await Promise.all([
      api.get('/swap-requests/sent'),
      api.get('/swap-requests/received'),
      api.get('/sessions/mine')
    ]);
    setSent(s.data.swapRequests);
    setReceived(r.data.swapRequests);
    setSessions(m.data);
  };
  useEffect(() => { load(); }, [api]);

  return (
    <div className="space-y-4">
      <PageHeader title="My Matches" subtitle="Your active swaps, upcoming sessions, and history." />
      <div className="card flex flex-wrap gap-2">
        {[
          { v: 'upcoming', l: 'Upcoming' },
          { v: 'sent', l: `Sent (${sent.length})` },
          { v: 'received', l: `Received (${received.length})` },
          { v: 'past', l: 'Past' }
        ].map((t) => (
          <button key={t.v} onClick={() => setTab(t.v)} className={`chip ${tab === t.v ? 'chip-ink' : ''}`}>{t.l}</button>
        ))}
      </div>

      {tab === 'upcoming' && (sessions.upcoming.length === 0 ? <Empty title="No upcoming sessions" body="Accept a swap request to schedule one." /> : (
        <div className="space-y-2">
          {sessions.upcoming.map((s) => {
            const other = s.teacher._id === me._id ? s.learner : s.teacher;
            return (
              <Link to={`/sessions/${s._id}`} key={s._id} className="card flex items-center justify-between gap-3 hover:border-ink-300">
                <div className="flex items-center gap-3">
                  <Avatar user={other} size={40} />
                  <div>
                    <div className="text-sm font-semibold">{s.teachSkill} ↔ {s.learnSkill}</div>
                    <div className="text-xs muted">with {other.name} · {new Date(s.scheduledStart).toLocaleString()}</div>
                  </div>
                </div>
                <Chip kind="ink">{s.status}</Chip>
              </Link>
            );
          })}
        </div>
      ))}

      {tab === 'sent' && (sent.length === 0 ? <Empty title="No sent requests" body="Find a peer to send your first request." /> : sent.map((sr) => <RequestRow key={sr._id} sr={sr} side="sent" onChange={load} />))}
      {tab === 'received' && (received.length === 0 ? <Empty title="No received requests" body="When someone wants to swap, you'll see it here." /> : received.map((sr) => <RequestRow key={sr._id} sr={sr} side="received" onChange={load} />))}

      {tab === 'past' && (sessions.past.length === 0 ? <Empty title="No past sessions yet" body="After a session is verified, it'll show here." /> : (
        <div className="space-y-2">
          {sessions.past.map((s) => (
            <Link to={`/sessions/${s._id}`} key={s._id} className="card flex items-center justify-between gap-3 hover:border-ink-300">
              <div className="flex items-center gap-3">
                <Avatar user={s.teacher._id === me._id ? s.learner : s.teacher} size={36} />
                <div>
                  <div className="text-sm font-semibold">{s.teachSkill} ↔ {s.learnSkill}</div>
                  <div className="text-xs muted">{new Date(s.scheduledStart).toLocaleString()}</div>
                </div>
              </div>
              <Chip>{s.status}</Chip>
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}
