import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';
import { toast } from '../components/Toaster.jsx';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('aarav.sharma@anurag.edu.in');
  const [password, setPassword] = useState('password123');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      nav('/');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-ink-50 p-6">
      <div className="w-full max-w-md card">
        <div className="mb-6 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-ink-900 text-ink-50 font-bold">SS</div>
          <div>
            <div className="text-lg font-bold tracking-tight">Skill Swap</div>
            <div className="text-xs muted">Anurag University · time-credit peer learning</div>
          </div>
        </div>
        <h1 className="section-title">Welcome back</h1>
        <p className="muted text-sm">Sign in with your Anurag email to keep swapping.</p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button disabled={busy} className="btn-primary w-full">{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <div className="mt-4 text-sm">
          New here? <Link to="/register" className="font-semibold text-ink-900 underline">Create an account</Link>
        </div>
        <div className="mt-6 rounded-lg border border-ink-200 bg-ink-50 p-3 text-xs muted">
          Demo accounts (seeded, password <code>password123</code>):
          <ul className="mt-1 list-disc pl-5">
            <li>aarav.sharma@anurag.edu.in (React/Node teacher, has 1 incoming swap + 1 upcoming session)</li>
            <li>diya.reddy@anurag.edu.in (Figma teacher)</li>
            <li>arjun.mehta@anurag.edu.in (mentor, 12 sessions taught)</li>
          </ul>
          <div className="mt-1">All 20 seeded accounts follow <code>firstname.lastname@anurag.edu.in</code>.</div>
        </div>
      </div>
    </div>
  );
}
