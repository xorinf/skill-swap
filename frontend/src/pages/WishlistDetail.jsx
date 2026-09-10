import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../lib/api.js';
import { useAuth } from '../state/AuthContext.jsx';
import { Avatar, Chip } from '../components/ui.jsx';
import { Spinner, PageHeader } from '../components/PageHeader.jsx';
import { toast } from '../components/Toaster.jsx';
import { HandHeart, ArrowLeft, MessageCircle } from 'lucide-react';

export default function WishlistDetail() {
  const { id } = useParams();
  const api = useApi();
  const { user: me } = useAuth();
  const nav = useNavigate();
  const [hr, setHr] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.get(`/help-requests/${id}`).then((r) => setHr(r.data.helpRequest)).catch(() => {}); }, [id, api]);

  if (!hr) return <div className="space-y-4"><PageHeader title="Help request" back /><Spinner label="Loading help request…" /></div>;
  const isMe = String(hr.author._id) === String(me?._id);

  const offer = async () => {
    setBusy(true);
    try {
      await api.post(`/help-requests/${id}/offer`, {});
      toast.success('Offer sent');
      const conv = await api.post(`/messages/with/${hr.author._id}`, {});
      nav(`/messages/${conv.data.conversation._id}`);
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const openChat = async () => {
    const conv = await api.post(`/messages/with/${hr.author._id}`, {});
    nav(`/messages/${conv.data.conversation._id}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => nav(-1)} className="row text-sm muted hover:text-ink-900"><ArrowLeft className="h-4 w-4" /> Back</button>
        {!isMe && (
          <Link to={`/messages/with/${hr.author._id}`} onClick={(e) => { e.preventDefault(); openChat(); }} className="row text-sm muted hover:text-ink-900">
            <MessageCircle className="h-4 w-4" /> Message
          </Link>
        )}
      </div>
      <div className="card">
        <div className="flex items-center gap-2 text-xs muted">
          <Chip kind="ink">{hr.skillNeeded}</Chip>
          {hr.creditReward > 0 && <Chip>+{hr.creditReward} credit</Chip>}
          <Chip>{hr.status}</Chip>
        </div>
        <h1 className="mt-2 text-2xl font-bold">{hr.title}</h1>
        <p className="mt-3 whitespace-pre-wrap text-sm">{hr.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">{hr.tags?.map((t) => <Chip key={t}>#{t}</Chip>)}</div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {hr.currentLevel && <Field label="Current level" value={hr.currentLevel} />}
          {hr.tried && <Field label="Tried" value={hr.tried} />}
          {hr.repoLink && <Field label="Repo" value={<a className="underline" href={hr.repoLink} target="_blank" rel="noreferrer">{hr.repoLink}</a>} />}
          {hr.errorTrace && <Field label="Error / trace" value={hr.errorTrace} />}
          {hr.prerequisites && <Field label="Prerequisites" value={hr.prerequisites} />}
          {hr.targetGoal && <Field label="Target goal" value={hr.targetGoal} />}
          {hr.preferredTime && <Field label="Preferred time" value={hr.preferredTime} />}
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs muted">
          <Link to={`/matches/${hr.author._id}`} className="row hover:text-ink-900">
            <Avatar user={hr.author} size={24} />
            <span><b className="text-ink-800">{hr.author?.name}</b>{hr.author?.department ? ` · ${hr.author.department}` : ''}</span>
          </Link>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={offer} disabled={busy} className="btn-primary"><HandHeart className="h-4 w-4" />Offer help</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="rounded-lg border border-ink-200 p-3 text-sm">
      <div className="label">{label}</div>
      <div>{value}</div>
    </div>
  );
}
