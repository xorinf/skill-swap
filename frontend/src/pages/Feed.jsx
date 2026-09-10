import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../lib/api.js';
import { Avatar, Chip, Empty, relativeTime } from '../components/ui.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { Plus, Heart, MessageCircle } from 'lucide-react';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'NEED_HELP', label: 'Need Help' },
  { value: 'OFFERING', label: 'Offering Skills' },
  { value: 'PROJECT', label: 'Projects' }
];

export default function Feed() {
  const api = useApi();
  const [filter, setFilter] = useState('');
  const [posts, setPosts] = useState([]);

  const load = () => {
    const q = filter ? `?intent=${filter}` : '';
    api.get(`/posts${q}`).then((r) => setPosts(r.data.posts)).catch(() => {});
  };
  useEffect(load, [filter, api]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Campus feed"
        subtitle="What students on your campus are offering, asking for, and building."
        action={
          <Link to="/feed/new" className="btn-primary"><Plus className="h-4 w-4" />New post</Link>
        }
      />

      <div className="card flex flex-wrap items-center gap-2">
        <div className="flex-1 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button key={f.value} onClick={() => setFilter(f.value)} className={`chip ${filter === f.value ? 'chip-ink' : ''}`}>{f.label}</button>
          ))}
        </div>
      </div>

      {posts.length === 0 ? <Empty title="No posts here yet" body="Be the first to share an offer or a help request." /> : (
        <div className="space-y-3">
          {posts.map((p) => (
            <Link to={`/feed/${p._id}`} key={p._id} className="card block hover:border-ink-300">
              <div className="flex items-center gap-2 text-xs muted">
                <Chip kind="ink">{p.intent.replace('_', ' ')}</Chip>
                {p.creditReward > 0 && <Chip>+{p.creditReward} credit</Chip>}
                <span className="ml-auto">{relativeTime(p.createdAt)}</span>
              </div>
              <h3 className="mt-2 text-lg font-semibold">{p.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm muted">{p.body}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.tags?.slice(0, 6).map((t) => <Chip key={t}>#{t}</Chip>)}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs muted">
                <div className="flex items-center gap-2">
                  <Avatar user={p.author} size={24} />
                  <span>{p.author?.name} {p.author?.department ? `· ${p.author.department}` : ''}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="row"><Heart className="h-3.5 w-3.5" />{p.likes?.length || 0}</span>
                  <span className="row"><MessageCircle className="h-3.5 w-3.5" />{p.commentsCount || 0}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
