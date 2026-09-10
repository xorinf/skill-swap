import { useRef, useState } from 'react';
import { useApi } from '../lib/api.js';
import { useAuth } from '../state/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { Avatar, Chip, Section } from '../components/ui.jsx';
import { toast } from '../components/Toaster.jsx';

const CATEGORIES = ['Programming', 'Web Development', 'Design', 'UI/UX', 'Machine Learning', 'Data Science', 'Mathematics', 'Languages', 'Other'];
const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function SkillEditor({ title, list, onAdd, onRemove, kind = 'teach' }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(kind === 'teach' ? 'Web Development' : 'Other');
  const [proficiency, setProficiency] = useState(kind === 'teach' ? 'intermediate' : 'beginner');

  return (
    <Section title={title}>
      <div className="card space-y-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[12rem] flex-1">
            <label className="label">Skill</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. React, DSA, Figma" />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Level</label>
            <select className="input" value={proficiency} onChange={(e) => setProficiency(e.target.value)}>
              {LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
          <button
            className="btn-primary"
            onClick={async () => {
              if (!name.trim()) return;
              await onAdd({ name: name.trim(), category, proficiency });
              setName('');
            }}
          >Add</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {list.length === 0 ? <span className="muted text-sm">Nothing yet.</span> : list.map((s) => (
            <Chip key={s.name} onRemove={onRemove ? () => onRemove(s.name) : undefined}>{s.name} · {s.proficiency}</Chip>
          ))}
        </div>
      </div>
    </Section>
  );
}

function SlotEditor({ slots, onChange }) {
  const [day, setDay] = useState('Mon');
  const [start, setStart] = useState('18:00');
  const [end, setEnd] = useState('20:00');

  return (
    <Section title="Weekly availability">
      <div className="card space-y-3">
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="label">Day</label>
            <select className="input" value={day} onChange={(e) => setDay(e.target.value)}>
              {DAYS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label">From</label>
            <input type="time" className="input" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label className="label">To</label>
            <input type="time" className="input" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={() => {
            if (start >= end) { toast.error('End must be after start'); return; }
            onChange([...slots, { day, start, end }]);
          }}>Add slot</button>
        </div>
        <ul className="divide-y divide-ink-100">
          {slots.map((s, i) => (
            <li key={i} className="flex items-center justify-between py-2 text-sm">
              <span><b>{s.day}</b> · {s.start}–{s.end}</span>
              <button className="text-xs text-ink-500 hover:text-ink-900" onClick={() => onChange(slots.filter((_, j) => j !== i))}>remove</button>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

export default function EditProfile() {
  const api = useApi();
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: user.name, department: user.department || '', year: user.year || '', bio: user.bio || '',
    skillsCanTeach: user.skillsCanTeach || [],
    skillsToLearn: user.skillsToLearn || [],
    availability: user.availability || []
  });
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const [photoBusy, setPhotoBusy] = useState(false);

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Pick an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return; }
    setPhotoBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('/api/uploads/upload', { method: 'POST', body: fd, credentials: 'include' });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error?.message || 'Upload failed');
      await api.post('/users/me/photo', { publicId: data.data.publicId, url: data.data.url });
      await refresh();
      toast.success('Photo updated');
    } catch (err) { toast.error(err.message); }
    finally { setPhotoBusy(false); e.target.value = ''; }
  };

  const add = (kind) => async (skill) => {
    const list = kind === 'teach' ? form.skillsCanTeach : form.skillsToLearn;
    if (list.some((s) => s.name.toLowerCase() === skill.name.toLowerCase())) {
      toast.info('Already in your list');
      return;
    }
    const endpoint = kind === 'teach' ? '/users/me/skills/teach' : '/users/me/skills/learn';
    const r = await api.post(endpoint, { skill });
    setForm((f) => ({ ...f, [kind === 'teach' ? 'skillsCanTeach' : 'skillsToLearn']: r.data.user[kind === 'teach' ? 'skillsCanTeach' : 'skillsToLearn'] }));
  };
  const remove = (kind) => async (name) => {
    const endpoint = kind === 'teach' ? `/users/me/skills/teach/${encodeURIComponent(name)}` : `/users/me/skills/learn/${encodeURIComponent(name)}`;
    const r = await api.del(endpoint);
    setForm((f) => ({ ...f, [kind === 'teach' ? 'skillsCanTeach' : 'skillsToLearn']: r.data.user[kind === 'teach' ? 'skillsCanTeach' : 'skillsToLearn'] }));
  };

  const save = async () => {
    setBusy(true);
    try {
      const r = await api.put('/users/me', form);
      await refresh();
      toast.success('Profile saved');
      nav('/profile');
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <div className="card space-y-3">
        <h1 className="section-title">Edit profile</h1>
        <div className="flex items-center gap-4">
          <Avatar user={user} size={64} />
          <div className="flex-1">
            <div className="text-sm font-semibold">{user.name}</div>
            <div className="muted text-xs">Profile picture is visible across Skill Swap.</div>
          </div>
          <button type="button" onClick={() => fileRef.current?.click()} disabled={photoBusy} className="btn-secondary">
            {photoBusy ? 'Uploading…' : 'Change photo'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Department</label>
              <input className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div>
              <label className="label">Year</label>
              <input className="input" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
            </div>
          </div>
        </div>
        <div>
          <label className="label">Bio</label>
          <textarea rows={3} className="input" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </div>
      </div>

      <SkillEditor title="Skills you can TEACH" list={form.skillsCanTeach} onAdd={add('teach')} onRemove={remove('teach')} kind="teach" />
      <SkillEditor title="Skills you want to LEARN" list={form.skillsToLearn} onAdd={add('learn')} onRemove={remove('learn')} kind="learn" />

      <SlotEditor slots={form.availability} onChange={(s) => setForm({ ...form, availability: s })} />

      <div className="flex justify-end gap-2">
        <button onClick={save} disabled={busy} className="btn-primary">{busy ? 'Saving…' : 'Save profile'}</button>
      </div>
    </div>
  );
}
