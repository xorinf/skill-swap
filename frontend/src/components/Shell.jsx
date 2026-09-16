import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';
import { useEffect, useState } from 'react';
import { useApi } from '../lib/api.js';
import { BrandMark } from '../pages/Landing.jsx';
import { Bell, MessageCircle, Search, LayoutGrid, Users, Sparkles, Trophy, Wallet, User as UserIcon, Plus, Settings as Cog, LogOut } from 'lucide-react';

const NAV = [
  { to: '/',              label: 'Discover',     icon: Sparkles,     end: true },
  { to: '/discover/ai',   label: 'AI Discover',  icon: Sparkles },
  { to: '/matches',       label: 'People',       icon: Users },
  { to: '/feed',          label: 'Feed',         icon: LayoutGrid },
  { to: '/my-matches',    label: 'My Matches',   icon: MessageCircle },
  { to: '/wishlist',      label: 'Wishlist',     icon: Plus },
  { to: '/credits',       label: 'Time Credits', icon: Wallet },
  { to: '/impact',        label: 'Impact',       icon: Trophy },
  { to: '/settings',      label: 'Settings',     icon: Cog },
];

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

  const linkClass = ({ isActive }) =>
    `group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-ink-900 text-ink-50'
        : 'text-ink-700 hover:bg-ink-100 hover:text-ink-900'
    }`;

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5 text-ink-900">
            <BrandMark className="h-8 w-8" />
            <div className="hidden sm:block leading-tight">
              <div className="text-sm font-bold tracking-tight">Skill Swap</div>
              <div className="text-[10px] uppercase tracking-wider text-ink-500">Anurag University</div>
            </div>
          </Link>

          <div className="flex flex-1 justify-center md:max-w-md">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                placeholder="Search people, skills, posts…"
                className="input pl-9"
                onKeyDown={(e) => { if (e.key === 'Enter' && e.target.value.trim()) nav(`/matches?q=${encodeURIComponent(e.target.value.trim())}`); }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/credits"
              className="hidden items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-800 hover:border-ink-300 hover:bg-ink-50 md:inline-flex"
              title="Your Time Credits"
            >
              <Wallet className="h-4 w-4" />
              <span>{user?.timeCredits ?? 0}</span>
              <span className="text-ink-500">credits</span>
            </Link>
            <Link
              to="/notifications"
              className="relative grid h-9 w-9 place-items-center rounded-lg border border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50"
              aria-label={`Notifications (${unread} unread)`}
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full border border-white bg-ink-900 px-1 text-[10px] font-semibold text-ink-50 text-center leading-[18px]">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </Link>
            <Link
              to="/profile"
              className="grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-ink-200 bg-white"
              aria-label="Your profile"
            >
              {user?.photo?.url
                ? <img src={user.photo.url} alt="" className="h-full w-full object-cover" />
                : <span className="text-xs font-semibold text-ink-700">{(user?.name || '?').split(' ').map((p) => p[0]).slice(0,2).join('').toUpperCase()}</span>}
            </Link>
          </div>
        </div>
      </header>

      {/* Body grid */}
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <aside className="hidden w-56 shrink-0 md:block">
          <nav className="sticky top-20 space-y-0.5">
            {NAV.map((n) => {
              const Icon = n.icon;
              return (
                <NavLink key={n.to} to={n.to} end={n.end} className={linkClass}>
                  <Icon className="h-4 w-4" />
                  <span>{n.label}</span>
                </NavLink>
              );
            })}
            <div className="my-3 h-px bg-ink-200" />
            <button
              onClick={async () => { await logout(); nav('/welcome'); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-ink-100 hover:text-ink-900"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </nav>
        </aside>

        <main className="min-w-0 flex-1 pb-20 md:pb-0">{children}</main>
      </div>

      {/* Mobile bottom tab bar — mirrors the top 5 nav items */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-ink-200 bg-white/95 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {NAV.slice(0, 5).map((n) => {
            const Icon = n.icon;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                    isActive ? 'text-ink-900' : 'text-ink-500 hover:text-ink-800'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                <span>{n.label === 'AI Discover' ? 'AI' : n.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
