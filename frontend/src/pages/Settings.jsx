import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';
import { Section, Stat } from '../components/ui.jsx';
import { PageHeader, Spinner } from '../components/PageHeader.jsx';
import { LogOut } from 'lucide-react';

export default function Settings() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const out = async () => {
    try { await logout(); } catch { /* ignore */ }
    nav('/login');
  };

  if (!user) {
    return (
      <div className="space-y-4">
        <PageHeader title="Settings" subtitle="Manage your account and session." />
        <Spinner label="Loading your account…" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Settings" subtitle="Manage your account and session." />

      <Section title="Account">
        <div className="card grid gap-3 sm:grid-cols-2 text-sm">
          <div><div className="label">Name</div> <b>{user.name}</b></div>
          <div><div className="label">Email</div> {user.email}</div>
          <div><div className="label">Department</div> {user.department || '—'}</div>
          <div><div className="label">Year</div> {user.year || '—'}</div>
        </div>
      </Section>

      <Section title="Time Credits">
        <div className="card">
          <Stat label="Current balance" value={user.timeCredits ?? 0} />
          <div className="mt-2 text-sm text-ink-600">Earn credits by teaching, spend them to learn. <a className="underline" href="/credits">See full history</a>.</div>
        </div>
      </Section>

      <Section title="Session">
        <div className="card flex items-center justify-between gap-3">
          <p className="text-sm text-ink-700">Sign out of Skill Swap. Your swaps, sessions and credits are safe.</p>
          <button onClick={out} className="btn-secondary"><LogOut className="h-4 w-4" />Sign out</button>
        </div>
      </Section>
    </div>
  );
}
