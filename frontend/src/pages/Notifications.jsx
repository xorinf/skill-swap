import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../lib/api.js';
import { useSocket } from '../state/SocketContext.jsx';
import { Empty, Chip, relativeTime } from '../components/ui.jsx';
import { PageHeader } from '../components/PageHeader.jsx';

const TYPE_LABEL = {
  swap_request: 'Swap request',
  swap_accepted: 'Swap accepted',
  swap_rejected: 'Swap declined',
  swap_reschedule: 'Reschedule proposed',
  swap_cancelled: 'Swap cancelled',
  session_upcoming: 'Session soon',
  session_verified: 'Verification ready',
  session_completed: 'Session completed',
  new_message: 'New message',
  rating_prompt: 'Rate this session',
  badge_earned: 'New badge',
  wishlist_offer: 'Help offered'
};

function targetFor(n) {
  const d = n.data || {};
  if (d.session) return { to: `/sessions/${d.session}`, label: 'Open session' };
  if (d.swapRequest) return { to: '/my-matches', label: 'Open matches' };
  if (d.conversation) return { to: `/messages/${d.conversation}`, label: 'Open chat' };
  if (d.helpRequest) return { to: `/wishlist/${d.helpRequest}`, label: 'Open request' };
  if (d.helper) return { to: '/wishlist', label: 'Open wishlist' };
  return null;
}

export default function Notifications() {
  const api = useApi();
  const { socket } = useSocket();
  const [items, setItems] = useState([]);

  const load = () => api.get('/notifications').then((r) => setItems(r.data.notifications)).catch(() => {});
  useEffect(() => { load(); }, [api]);
  useEffect(() => {
    if (!socket) return;
    const h = () => load();
    socket.on('notification', h);
    return () => socket.off('notification', h);
  }, [socket]);

  const markAll = async () => { await api.post('/notifications/read-all', {}); load(); };
  const markOne = async (id) => { await api.post(`/notifications/${id}/read`, {}); load(); };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Notifications"
        subtitle="Swap activity, session reminders, and badge unlocks."
        action={<button onClick={markAll} className="btn-secondary text-xs">Mark all read</button>}
      />
      {items.length === 0 ? <Empty title="Nothing here" body="You're all caught up." /> : (
        <ul className="mt-3 divide-y divide-ink-100">
          {items.map((n) => {
            const t = targetFor(n);
            return (
              <li key={n._id} className={`flex items-start gap-2 py-3 ${!n.read ? 'bg-ink-50' : ''} rounded-lg px-2`}>
                <Chip>{TYPE_LABEL[n.type] || n.type}</Chip>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{n.title}</div>
                  {n.body && <div className="text-xs muted">{n.body}</div>}
                  {t && <Link to={t.to} onClick={() => markOne(n._id)} className="text-xs underline">{t.label} →</Link>}
                </div>
                <div className="text-xs muted">{relativeTime(n.createdAt)}</div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
