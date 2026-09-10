import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../lib/api.js';
import { Avatar, Chip, Empty, relativeTime } from '../components/ui.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { Plus } from 'lucide-react';

const STATUS = [
  { v: 'open', l: 'Open' },
  { v: 'in_progress', l: 'In progress' },
  { v: 'closed', l: 'Closed' }
];

export default function Wishlist() {
  const api = useApi();
  const [status, setStatus] = useState('open');
  const [list, setList] = useState([]);

  useEffect(() => { api.get(`/help-requests?status=${status}`).then((r) => setList(r.data.helpRequests)).catch(() => {}); }, [status, api]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Wishlist"
        subtitle="Help requests from students who couldn't find a direct match."
        action={
          <Link to="/wishlist/new" className="btn-primary"><Plus className="h-4 w-4" />New help request</Link>
        }
      />
      <div className="card flex flex-wrap items-center gap-2">
        <div className="flex-1 flex flex-wrap gap-2">
          {STATUS.map((s) => <button key={s.v} onClick={() => setStatus(s.v)} className={`chip ${status === s.v ? 'chip-ink' : ''}`}>{s.l}</button>)}
        </div>
      </div>
      {list.length === 0 ? <Empty title="No help requests here" body="Be the first to ask for help on a specific topic." /> : (
        <div className="space-y-3">
          {list.map((hr) => (
            <Link to={`/wishlist/${hr._id}`} key={hr._id} className="card block hover:border-ink-300">
              <div className="flex items-center gap-2 text-xs muted">
                <Chip kind="ink">{hr.skillNeeded}</Chip>
                {hr.creditReward > 0 && <Chip>+{hr.creditReward} credit</Chip>}
                <span className="ml-auto">{relativeTime(hr.createdAt)}</span>
              </div>
              <h3 className="mt-2 text-lg font-semibold">{hr.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm muted">{hr.description}</p>
              <div className="mt-3 flex items-center gap-2 text-xs muted">
                <Avatar user={hr.author} size={20} />
                <span>{hr.author?.name}{hr.author?.department ? ` · ${hr.author.department}` : ''}</span>
                {hr.offers?.length > 0 && <span className="ml-auto">{hr.offers.length} offer{hr.offers.length === 1 ? '' : 's'}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
