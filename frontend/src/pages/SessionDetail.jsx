import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../lib/api.js';
import { useAuth } from '../state/AuthContext.jsx';
import { Avatar, Chip, StarRating, Empty } from '../components/ui.jsx';
import { Spinner, PageHeader } from '../components/PageHeader.jsx';
import { toast } from '../components/Toaster.jsx';
import { KeyRound, Check, MessageCircle, RotateCw, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function SessionDetail() {
  const { id } = useParams();
  const api = useApi();
  const { user: me } = useAuth();
  const nav = useNavigate();
  const [session, setSession] = useState(null);
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [reviews, setReviews] = useState([]);

  const load = async () => {
    const r = await api.get(`/sessions/session/${id}`);
    setSession(r.data.session);
    api.get(`/sessions/session/${id}/reviews`).then((r2) => setReviews(r2.data.reviews)).catch(() => {});
  };
  useEffect(() => { load(); }, [id, api]);

  if (!session) return <div className="space-y-4"><PageHeader title="Session" back /><Spinner label="Loading session…" /></div>;
  const other = session.teacher._id === me._id ? session.learner : session.teacher;
  const myConfirmed = (session.verifiedBy || []).map(String).includes(String(me._id));
  const bothConfirmed = (session.verifiedBy || []).length >= 2;

  const openChat = async () => {
    const conv = await api.post(`/messages/with/${other._id}`, {});
    nav(`/messages/${conv.data.conversation._id}`);
  };

  const start = async () => {
    setBusy(true);
    try { await api.post(`/sessions/session/${id}/start`, {}); await load(); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const issueOtp = async () => {
    setBusy(true);
    try {
      const r = await api.post(`/sessions/session/${id}/issue-otp`, {});
      toast.success(`OTP issued: ${r.data.code}`);
      await load();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const verify = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 4) { toast.error('Enter the 4-digit code'); return; }
    setBusy(true);
    try {
      await api.post(`/sessions/session/${id}/verify-otp`, { code: otp });
      toast.success('Verified');
      setOtp('');
      await load();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const submitReview = async () => {
    try {
      await api.post(`/sessions/session/${id}/review`, review);
      toast.success('Thanks for the review');
      await load();
    } catch (e) { toast.error(e.message); }
  };
  const reschedule = async () => {
    const start = prompt('New start (ISO, e.g. ' + new Date(Date.now() + 86400_000).toISOString().slice(0, 16) + '):');
    if (!start) return;
    const end = prompt('New end (ISO):');
    if (!end) return;
    try {
      await api.post(`/swap-requests/${session.swapRequest._id}/reschedule`, { proposedTime: { start: new Date(start).toISOString(), end: new Date(end).toISOString() } });
      toast.success('Reschedule proposed');
      load();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => nav(-1)} className="row text-sm muted hover:text-ink-900"><ArrowLeft className="h-4 w-4" /> Back</button>
        <Link to="/my-matches" className="text-sm muted hover:text-ink-900">My Matches</Link>
      </div>
      <div className="card">
        <div className="flex items-start gap-3">
          <Avatar user={other} size={56} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="section-title">{session.teachSkill} ↔ {session.learnSkill}</h1>
              <Chip kind="ink">{session.status}</Chip>
            </div>
            <div className="muted text-sm">with {other.name} · {new Date(session.scheduledStart).toLocaleString()} – {new Date(session.scheduledEnd).toLocaleTimeString()}</div>
          </div>
          <button onClick={openChat} className="btn-secondary"><MessageCircle className="h-4 w-4" />Chat</button>
        </div>
      </div>

      {/* TIMELINE */}
      <div className="card space-y-3">
        <Step done={['in_progress', 'otp_pending', 'verified', 'completed'].includes(session.status)} active={session.status === 'scheduled'} label="Scheduled" detail={new Date(session.scheduledStart).toLocaleString()} action={session.status === 'scheduled' && <button onClick={start} className="btn-primary">Start session</button>} />
        <Step done={['otp_pending', 'verified', 'completed'].includes(session.status)} active={false} label="Issue OTP" detail="Either side can generate a 4-digit code" action={['in_progress', 'scheduled', 'otp_pending'].includes(session.status) && <button onClick={issueOtp} className="btn-secondary"><KeyRound className="h-4 w-4" />Issue code</button>} />
        <Step done={bothConfirmed} active={session.status === 'otp_pending' && !myConfirmed} label="Verify with code" detail={session.otp ? 'Enter the 4-digit code shown to both participants.' : 'Issue a code first.'} action={session.otp && !bothConfirmed && (
          <form onSubmit={verify} className="flex gap-2">
            <input className="input w-32 text-center tracking-widest" maxLength={4} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="••••" />
            <button className="btn-primary"><ShieldCheck className="h-4 w-4" />Verify</button>
          </form>
        )} />
        <Step done={session.status === 'completed'} active={false} label="Credits settled + rated" detail="Time credits move and trust score updates." />
      </div>

      {session.status === 'verified' && (
        <div className="card">
          <h2 className="text-lg font-semibold">Leave a review</h2>
          <div className="mt-2 row">
            <StarRating value={review.rating} onChange={(r) => setReview((rv) => ({ ...rv, rating: r }))} />
            <input className="input flex-1" value={review.comment} onChange={(e) => setReview((rv) => ({ ...rv, comment: e.target.value }))} placeholder="What went well?" />
            <button onClick={submitReview} className="btn-primary"><Check className="h-4 w-4" />Submit</button>
          </div>
        </div>
      )}

      {session.summary && (
        <div className="card">
          <h2 className="text-lg font-semibold">AI session summary</h2>
          <p className="mt-1 text-sm muted whitespace-pre-wrap">{session.summary}</p>
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-semibold">Reviews</h2>
        {reviews.length === 0 ? <Empty title="No reviews yet" body="" /> : (
          <ul className="mt-3 space-y-2 text-sm">
            {reviews.map((r) => (
              <li key={r._id} className="rounded-lg border border-ink-200 p-3">
                <div className="row"><StarRating value={r.rating} readOnly size={14} /> <b className="ml-2">{r.rater?.name}</b></div>
                <p className="muted mt-1">{r.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {['scheduled', 'reschedule_requested'].includes(session.status) && (
        <div className="card">
          <button onClick={reschedule} className="btn-secondary"><RotateCw className="h-4 w-4" />Propose a new time</button>
        </div>
      )}
    </div>
  );
}

function Step({ done, active, label, detail, action }) {
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-3 ${done ? 'border-ink-800 bg-ink-50' : active ? 'border-ink-300' : 'border-ink-200'}`}>
      <div className={`mt-0.5 grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${done ? 'bg-ink-900 text-ink-50' : 'border border-ink-300'}`}>{done ? '✓' : '•'}</div>
      <div className="flex-1">
        <div className="text-sm font-semibold">{label}</div>
        <div className="muted text-xs">{detail}</div>
      </div>
      {action}
    </div>
  );
}
