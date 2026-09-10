import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../lib/api.js';
import { toast } from '../components/Toaster.jsx';

export default function NewWishlist() {
  const api = useApi();
  const nav = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', skillNeeded: '',
    currentLevel: '', tried: '', repoLink: '', errorTrace: '',
    prerequisites: '', targetGoal: '', preferredTime: '',
    creditReward: 0, tags: ''
  });
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { ...form, tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean) };
      const r = await api.post('/help-requests', payload);
      toast.success('Request created');
      nav(`/wishlist/${r.data.helpRequest._id}`);
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="card mx-auto max-w-3xl space-y-3">
      <h1 className="section-title">Ask for help</h1>
      <p className="muted text-sm">Be specific — the matcher uses these fields to find the right person.</p>
      <div>
        <label className="label">Title</label>
        <input className="input" value={form.title} onChange={set('title')} required maxLength={140} />
      </div>
      <div>
        <label className="label">Skill needed</label>
        <input className="input" value={form.skillNeeded} onChange={set('skillNeeded')} required placeholder="e.g. React, DSA, Figma" />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea rows={4} className="input" value={form.description} onChange={set('description')} maxLength={4000} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="label">Current level</label>
          <input className="input" value={form.currentLevel} onChange={set('currentLevel')} placeholder="e.g. comfortable with JS basics" />
        </div>
        <div>
          <label className="label">What you've tried</label>
          <input className="input" value={form.tried} onChange={set('tried')} placeholder="Stack Overflow, docs, ChatGPT…" />
        </div>
        <div>
          <label className="label">Repo / code link</label>
          <input className="input" type="url" value={form.repoLink} onChange={set('repoLink')} placeholder="https://github.com/…" />
        </div>
        <div>
          <label className="label">Error / traceback</label>
          <input className="input" value={form.errorTrace} onChange={set('errorTrace')} />
        </div>
        <div>
          <label className="label">Prerequisites</label>
          <input className="input" value={form.prerequisites} onChange={set('prerequisites')} placeholder="e.g. need to know hooks" />
        </div>
        <div>
          <label className="label">Target goal</label>
          <input className="input" value={form.targetGoal} onChange={set('targetGoal')} placeholder="What does 'done' look like?" />
        </div>
        <div>
          <label className="label">Preferred time</label>
          <input className="input" value={form.preferredTime} onChange={set('preferredTime')} placeholder="Sat 5–7 PM" />
        </div>
        <div>
          <label className="label">Credit reward</label>
          <input type="number" min="0" max="10" className="input" value={form.creditReward} onChange={set('creditReward')} />
        </div>
      </div>
      <div>
        <label className="label">Tags (comma separated)</label>
        <input className="input" value={form.tags} onChange={set('tags')} placeholder="react, jwt, project" />
      </div>
      <div className="flex justify-end">
        <button disabled={busy} className="btn-primary">{busy ? 'Posting…' : 'Post help request'}</button>
      </div>
    </form>
  );
}
