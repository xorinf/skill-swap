import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';
import { useEffect, useState } from 'react';
import { useApi } from '../lib/api.js';
import { Bell, MessageCircle, Search, LayoutGrid, Users, Sparkles, Trophy, Wallet, User as UserIcon, Plus } from 'lucide-react';

export default function Shell({ children }) {
  const { user, logout } = useAuth();
  const api = useApi();
  const [unread, setUnread] = useState(0);
  const nav = useNavigate();

  useEffect(() => {
    let alive = true;
    api.get('/notifications/unread-count')
      .then((r) => alive && setUnread(r.data.count))
      .catch(() => {});
    return () => { alive = false; };
  }, [api]);

  const link = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-ink-800 text-ink-50' : 'text-ink-700 hover:bg-ink-100'}`;

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-ink-900 text-ink-50">
              <span className="text-sm">SS</span>
            </div>
            <span className="text-lg">Skill Swap</span>
            <span className="hidden text-xs muted sm:inline">Anurag University</span>
          </Link>
          <div className="hidden flex-1 max-w-md md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                placeholder="Search people, skills, posts…"
                className="input pl-9"
                onKeyDown={(e) => { if (e.key === 'Enter') nav(`/matches?q=${encodeURIComponent(e.target.value)}`); }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/notifications" className="relative grid h-9 w-9 place-items-center rounded-lg border border-ink-200 hover:bg-ink-50">
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full border border-white bg-ink-900 px-1.5 text-[10px] font-semibold text-ink-50">{unread}</span>
              )}
            </Link>
            <Link to="/credits" className="hidden md:flex items-center gap-1 rounded-lg border border-ink-200 px-3 py-1.5 text-sm hover:bg-ink-50">
              <Wallet className="h-4 w-4" /> <b>{user?.timeCredits ?? 0}</b>
            </Link>
            <Link to="/profile" className="grid h-9 w-9 place-items-center rounded-full border border-ink-200 overflow-hidden">
              {user?.photo?.url ? <img src={user.photo.url} alt="" className="h-full w-full object-cover" /> : <UserIcon className="h-4 w-4" />}
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <aside className="hidden w-56 shrink-0 md:block">
          <nav className="sticky top-20 flex flex-col gap-1">
            <NavLink to="/" className={link} end><Sparkles className="h-4 w-4" />Discover</NavLink>
            <NavLink to="/discover/ai" className={link}><Sparkles className="h-4 w-4" />AI Discover</NavLink>
            <NavLink to="/matches" className={link}><Users className="h-4 w-4" />People</NavLink>
            <NavLink to="/feed" className={link}><LayoutGrid className="h-4 w-4" />Feed</NavLink>
            <NavLink to="/my-matches" className={link}><MessageCircle className="h-4 w-4" />My Matches</NavLink>
            <NavLink to="/wishlist" className={link}><Plus className="h-4 w-4" />Wishlist</NavLink>
            <NavLink to="/credits" className={link}><Wallet className="h-4 w-4" />Time Credits</NavLink>
            <NavLink to="/impact" className={link}><Trophy className="h-4 w-4" />Impact</NavLink>
            <NavLink to="/settings" className={link}><UserIcon className="h-4 w-4" />Settings</NavLink>
            <button onClick={async () => { await logout(); nav('/login'); }} className="mt-4 text-left text-xs text-ink-500 hover:text-ink-800">Sign out</button>
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
