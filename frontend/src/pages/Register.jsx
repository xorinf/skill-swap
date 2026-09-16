import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';
import { toast } from '../components/Toaster.jsx';
import { BrandMark } from './Landing.jsx';
import { ArrowRight } from 'lucide-react';

const DEPARTMENTS = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AI&ML', 'Data Science', 'Other'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Alumni'];

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    department: DEPARTMENTS[0], year: YEARS[1],
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await register(form);
      nav('/onboarding');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

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
            Join the campus skill exchange.
          </h2>
          <p className="mt-3 text-base text-ink-700">
            Three minutes to set up. After this, you'll add a few skills you teach and a few
            you want to learn, then we'll start surfacing matches.
          </p>
          <ol className="mt-8 space-y-3 text-sm text-ink-700">
            <li className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-ink-200 text-xs font-semibold">1</span>
              Create your account
            </li>
            <li className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-ink-200 text-xs font-semibold">2</span>
              Add 2+ skills to teach and 1+ to learn
            </li>
            <li className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-ink-200 text-xs font-semibold">3</span>
              Browse matches, propose a swap
            </li>
          </ol>
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
            <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
            <p className="mt-1 text-sm text-ink-700">Anurag email only. We'll walk you through onboarding next.</p>

            <form onSubmit={submit} className="mt-8 space-y-4">
              <div>
                <label className="label">Full name</label>
                <input className="input" value={form.name} onChange={set('name')} required minLength={2} autoComplete="name" />
              </div>
              <div>
                <label className="label">University email</label>
                <input className="input" type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
                <div className="mt-1 text-xs muted">Only <code>@anurag.edu.in</code> is accepted.</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Department</label>
                  <select className="input" value={form.department} onChange={set('department')}>
                    {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Year</label>
                  <select className="input" value={form.year} onChange={set('year')}>
                    {YEARS.map((y) => <option key={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Password</label>
                <input className="input" type="password" value={form.password} onChange={set('password')} required minLength={8} autoComplete="new-password" />
                <div className="mt-1 text-xs muted">At least 8 characters.</div>
              </div>
              <button disabled={busy} className="btn-primary w-full">
                {busy ? 'Creating…' : (<>Create account <ArrowRight className="h-4 w-4" /></>)}
              </button>
            </form>

            <div className="mt-6 text-sm text-ink-700">
              Already have an account? <Link to="/login" className="font-semibold text-ink-900 underline">Sign in</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
