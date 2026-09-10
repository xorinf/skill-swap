import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../lib/api.js';
import { Avatar, Empty, relativeTime } from '../components/ui.jsx';
import { PageHeader } from '../components/PageHeader.jsx';

export default function Messages() {
  const api = useApi();
  const nav = useNavigate();
  const [conversations, setConversations] = useState([]);

  useEffect(() => { api.get('/messages').then((r) => setConversations(r.data.conversations)).catch(() => {}); }, [api]);

  return (
    <div className="space-y-4">
      <PageHeader title="Messages" subtitle="Conversations tied to your swap requests." />
      {conversations.length === 0 ? (
        <Empty title="No conversations yet" body="When you send or receive a swap request, your chat will appear here." />
      ) : (
        <div className="card p-0">
          <ul className="divide-y divide-ink-100">
            {conversations.map((c) => {
              const other = c.participants.find((p) => p);
              return (
                <li key={c._id}>
                  <button onClick={() => nav(`/messages/${c._id}`)} className="flex w-full items-center gap-3 p-3 text-left hover:bg-ink-50">
                    <Avatar user={other} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="truncate text-sm font-semibold">{other?.name || 'Unknown'}</div>
                        <div className="text-xs muted">{relativeTime(c.lastMessageAt)}</div>
                      </div>
                      <div className="truncate text-xs muted">{c.lastMessagePreview || (c.context?.teachSkill ? `Swap: ${c.context.teachSkill} ↔ ${c.context.learnSkill}` : '—')}</div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
