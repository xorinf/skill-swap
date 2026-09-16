import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';
import { toast } from '../components/Toaster.jsx';
import { BrandMark } from './Landing.jsx';
import { ArrowRight } from 'lucide-react';

// Split-screen auth layout. Brand panel + point-form on the left (with the
// same BrandMark as the landing page), the actual form on the right.
// Pure monochrome, no gradients — matches the rest of the app.

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-ink-50 lg:grid lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden flex-col justify-between border-r border-ink-200 bg-white p-10 lg:flex">
        <Link to="/welcome" className="inline-flex items-center gap-2 text-ink-900">
          <BrandMark className="h-9 w-9" />
          <span className="text-lg font-bold tracking-tight">Skill Swap</span>
        </Link>

        <div className="max-w-md">
          <h2 className="text-3xl font-bold tracking-tight text-ink-900">
            {title}
          </h2>
          <p className="mt-3 text-base text-ink-700">{subtitle}</p>
          <ul className="mt-8 space-y-3 text-sm text-ink-700">
            <li className="flex gap-3">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-900" />
              Teach what you already know, learn what you've been putting off.
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-900" />
              Time Credits settle atomically when both sides confirm a session.
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-900" />
              Trust score and badges make repeat peers easier to find.
            </li>
          </ul>
        </div>

        <div className="text-xs muted">Anurag University · internal pilot</div>
      </aside>

      {/* Form panel */}
      <main className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between border-b border-ink-200 bg-white px-6 py-4 lg:hidden">
          <Link to="/welcome" className="inline-flex items-center gap-2">
            <BrandMark className="h-7 w-7" />
            <span className="font-bold tracking-tight">Skill Swap</span>
          </Link>
        </header>
        <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-ink-700">{subtitle}</p>
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-6 text-sm text-ink-700">{footer}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}

export function Login() {
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
    <AuthShell
      title="Welcome back"
      subtitle="Sign in with your Anurag email to keep swapping."
      footer={<>New here? <Link to="/register" className="font-semibold text-ink-900 underline">Create an account</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </div>
        <button disabled={busy} className="btn-primary w-full">
          {busy ? 'Signing in…' : (<>Sign in <ArrowRight className="h-4 w-4" /></>)}
        </button>
      </form>

      <div className="mt-8 rounded-lg border border-ink-200 bg-white p-3 text-xs text-ink-700">
        <div className="font-semibold text-ink-900">Demo accounts</div>
        <ul className="mt-1.5 space-y-1">
          <li><code>aarav.sharma@anurag.edu.in</code> · React / Node</li>
          <li><code>diya.reddy@anurag.edu.in</code> · Figma teacher</li>
          <li><code>arjun.mehta@anurag.edu.in</code> · mentor</li>
        </ul>
        <div className="mt-1.5">Password for all: <code>password123</code></div>
      </div>
    </AuthShell>
  );
}

export default Login;
