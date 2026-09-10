import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';
import { toast } from '../components/Toaster.jsx';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '', year: '' });
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
    <div className="min-h-screen grid place-items-center bg-ink-50 p-6">
      <div className="w-full max-w-md card">
        <h1 className="section-title">Join Skill Swap</h1>
        <p className="muted text-sm">Use your Anurag University email — your account won't activate otherwise.</p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <div>
            <label className="label">Full name</label>
            <input className="input" value={form.name} onChange={set('name')} required minLength={2} />
          </div>
          <div>
            <label className="label">University email</label>
            <input className="input" type="email" value={form.email} onChange={set('email')} required />
            <div className="mt-1 text-xs muted">Only <code>@anurag.edu.in</code> emails are accepted.</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Department</label>
              <input className="input" value={form.department} onChange={set('department')} placeholder="CSE / ECE / IT" />
            </div>
            <div>
              <label className="label">Year</label>
              <input className="input" value={form.year} onChange={set('year')} placeholder="2nd Year" />
            </div>
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={form.password} onChange={set('password')} required minLength={8} />
            <div className="mt-1 text-xs muted">At least 8 characters.</div>
          </div>
          <button disabled={busy} className="btn-primary w-full">{busy ? 'Creating…' : 'Create account'}</button>
        </form>
        <div className="mt-4 text-sm">
          Already have an account? <Link to="/login" className="font-semibold text-ink-900 underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
