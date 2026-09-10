import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../lib/api.js';
import { toast } from '../components/Toaster.jsx';

const INTENTS = [
  { value: 'OFFERING', label: 'OFFERING A SKILL' },
  { value: 'NEED_HELP', label: 'NEEDING HELP' },
  { value: 'PROJECT', label: 'PROJECT / COLLAB' }
];

export default function CreatePost() {
  const api = useApi();
  const nav = useNavigate();
  const [form, setForm] = useState({ intent: 'OFFERING', title: '', body: '', tags: '', relatedSkills: '', creditReward: 0 });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
        relatedSkills: form.relatedSkills.split(',').map((s) => s.trim()).filter(Boolean)
      };
      const r = await api.post('/posts', payload);
      toast.success('Posted');
      nav(`/feed/${r.data.post._id}`);
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="card mx-auto max-w-2xl space-y-3">
      <h1 className="section-title">Create a post</h1>
      <div>
        <label className="label">Intent</label>
        <div className="flex flex-wrap gap-2">
          {INTENTS.map((i) => (
            <button type="button" key={i.value} onClick={() => setForm({ ...form, intent: i.value })} className={`chip ${form.intent === i.value ? 'chip-ink' : ''}`}>{i.label}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Title</label>
        <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={140} />
      </div>
      <div>
        <label className="label">Body</label>
        <textarea rows={5} className="input" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} maxLength={4000} />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="md:col-span-2">
          <label className="label">Tags (comma separated)</label>
          <input className="input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="react, frontend, project" />
        </div>
        <div>
          <label className="label">Credit reward</label>
          <input className="input" type="number" min="0" max="10" value={form.creditReward} onChange={(e) => setForm({ ...form, creditReward: Number(e.target.value) })} />
        </div>
      </div>
      <div>
        <label className="label">Related skills (comma separated)</label>
        <input className="input" value={form.relatedSkills} onChange={(e) => setForm({ ...form, relatedSkills: e.target.value })} placeholder="React, Figma" />
      </div>
      <div className="flex justify-end">
        <button disabled={busy} className="btn-primary">{busy ? 'Posting…' : 'Publish'}</button>
      </div>
    </form>
  );
}
