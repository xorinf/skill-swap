import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../lib/api.js';
import { useAuth } from '../state/AuthContext.jsx';
import { Avatar, Chip, Empty, relativeTime } from '../components/ui.jsx';
import { Spinner, PageError, PageHeader } from '../components/PageHeader.jsx';
import { toast } from '../components/Toaster.jsx';
import { HandHeart, ArrowLeft, Send, MessageCircle } from 'lucide-react';

export default function PostDetail() {
  const { id } = useParams();
  const api = useApi();
  const { user: me } = useAuth();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api.get(`/posts/${id}`).then((r) => setData(r.data));
  useEffect(() => { load(); }, [id, api]);

  if (!data) return <div className="space-y-4"><PageHeader title="Post" back /><Spinner label="Loading post…" /></div>;
  const { post, comments } = data;
  const isMe = String(post.author._id) === String(me._id);

  const like = async () => {
    await api.post(`/posts/${id}/like`, {});
    load();
  };
  const comment = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await api.post(`/posts/${id}/comments`, { text });
    setText('');
    load();
  };
  const offerHelp = async () => {
    setBusy(true);
    try {
      // First ensure a conversation exists with the author
      const conv = await api.post(`/messages/with/${post.author._id}`, {});
      nav(`/messages/${conv.data.conversation._id}`);
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };
  const openChat = async () => {
    const conv = await api.post(`/messages/with/${post.author._id}`, {});
    nav(`/messages/${conv.data.conversation._id}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => nav(-1)} className="row text-sm muted hover:text-ink-900"><ArrowLeft className="h-4 w-4" /> Back</button>
        {!isMe && (
          <Link to={`/messages/with/${post.author._id}`} onClick={(e) => { e.preventDefault(); openChat(); }} className="row text-sm muted hover:text-ink-900">
            <MessageCircle className="h-4 w-4" /> Message
          </Link>
        )}
      </div>
      <div className="card">
        <div className="flex items-center gap-2 text-xs muted">
          <Chip kind="ink">{post.intent.replace('_', ' ')}</Chip>
          {post.creditReward > 0 && <Chip>+{post.creditReward} credit</Chip>}
          <span className="ml-auto">{relativeTime(post.createdAt)}</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold">{post.title}</h1>
        <p className="mt-3 whitespace-pre-wrap text-sm">{post.body}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.tags?.map((t) => <Chip key={t}>#{t}</Chip>)}
          {post.relatedSkills?.map((s) => <Chip key={s} kind="ink">{s}</Chip>)}
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs muted">
          <Link to={`/matches/${post.author._id}`} className="row hover:text-ink-900">
            <Avatar user={post.author} size={24} />
            <span><b className="text-ink-800">{post.author?.name}</b>{post.author?.department ? ` · ${post.author.department}` : ''}</span>
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={like} className="btn-secondary">{post.likes?.includes(me._id) ? '♥ Liked' : '♡ Like'} ({post.likes?.length || 0})</button>
          {post.intent === 'NEED_HELP' && String(post.author._id) !== String(me._id) && (
            <button onClick={offerHelp} disabled={busy} className="btn-primary"><HandHeart className="h-4 w-4" /> Offer Help</button>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold">Comments</h2>
        <form onSubmit={comment} className="mt-3 flex gap-2">
          <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a comment…" />
          <button className="btn-primary"><Send className="h-4 w-4" /></button>
        </form>
        <div className="mt-4 space-y-3">
          {comments.length === 0 ? <Empty title="No comments yet" body="" /> : comments.map((c) => (
            <div key={c._id} className="flex gap-2">
              <Avatar user={c.author} size={28} />
              <div className="flex-1">
                <div className="text-xs muted"><b className="text-ink-800">{c.author?.name}</b> · {relativeTime(c.createdAt)}</div>
                <div className="text-sm">{c.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
