import { useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useApi } from '../lib/api.js';
import { useAuth } from '../state/AuthContext.jsx';
import { Avatar, Chip } from '../components/ui.jsx';
import { toast } from '../components/Toaster.jsx';
import { Camera, Check, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

const CATEGORIES = ['Programming', 'Web Development', 'Design', 'UI/UX', 'Machine Learning', 'Data Science', 'Mathematics', 'Languages', 'Other'];
const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AI&ML', 'Data Science', 'Other'];

export default function Onboarding() {
  const api = useApi();
  const { user, bootstrapped, refresh } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const [photoBusy, setPhotoBusy] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || '',
    department: user?.department || 'CSE',
    year: user?.year || '2nd Year',
    bio: user?.bio || '',
    skillsCanTeach: user?.skillsCanTeach || [],
    skillsToLearn: user?.skillsToLearn || [],
    availability: user?.availability || []
  });

  // If not signed in, send to login.
  if (bootstrapped && !user) {
    return <Navigate to="/login" replace />;
  }
  if (!user) {
    // Bootstrapping or no user yet — give AuthContext a moment to settle.
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50">
        <div className="card flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-ink-200 border-t-ink-800" />
          <span className="text-ink-700">Loading your account…</span>
        </div>
      </div>
    );
  }

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Pick an image'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5 MB'); return; }
    setPhotoBusy(true);
    try {
      // Backend-mediated upload — works even if Cloudinary account email isn't verified.
      const fd = new FormData();
      fd.append('file', file);
      const token = localStorage.getItem('skillswap.token') || '';
      const up = await fetch(`${import.meta.env.VITE_API_URL}/uploads/upload`, {
        method: 'POST', body: fd, credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const upData = await up.json();
      if (!up.ok) throw new Error(upData.error?.message || 'Upload failed');
      const { publicId, url, size } = upData.data || upData;
      await api.post('/users/me/photo', { publicId, url });
      await refresh();
      toast.success('Photo saved');
    } catch (err) { toast.error(err.message); }
    finally { setPhotoBusy(false); e.target.value = ''; }
  };

  const addSkill = (kind) => (skill) => {
    const key = kind === 'teach' ? 'skillsCanTeach' : 'skillsToLearn';
    if (form[key].some((s) => s.name.toLowerCase() === skill.name.toLowerCase())) {
      toast.info('Already added');
      return;
    }
    setForm((f) => ({ ...f, [key]: [...f[key], skill] }));
  };
  const removeSkill = (kind) => (name) => {
    const key = kind === 'teach' ? 'skillsCanTeach' : 'skillsToLearn';
    setForm((f) => ({ ...f, [key]: f[key].filter((s) => s.name !== name) }));
  };
  const addSlot = (slot) => setForm((f) => ({ ...f, availability: [...f.availability, slot] }));
  const removeSlot = (i) => setForm((f) => ({ ...f, availability: f.availability.filter((_, j) => j !== i) }));

  const finish = async (skip = false) => {
    setBusy(true);
    try {
      // Save what we have. Backend will accept even empty arrays.
      await api.put('/users/me', {
        ...form,
        // Strip subdoc helpers — backend derives them from skillsCanTeach/skillsToLearn
        onboarded: !skip && (form.skillsCanTeach.length + form.skillsToLearn.length > 0)
      });
      await refresh();
      nav('/', { replace: true });
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-8">
        <header className="mb-6 flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-ink-900 text-ink-50">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Set up your Skill Swap profile</div>
            <div className="muted text-xs">{user?.email}</div>
          </div>
          <button onClick={() => finish(true)} className="text-xs muted hover:text-ink-900">Skip for now</button>
        </header>

        <ProgressBar step={step} />

        <main className="card mt-4 flex-1 space-y-5">
          {step === 0 && (
            <ProfileStep
              form={form} setForm={setForm}
              fileRef={fileRef} photoBusy={photoBusy}
              onPhoto={uploadPhoto}
            />
          )}
          {step === 1 && (
            <SkillsStep
              form={form} addSkill={addSkill} removeSkill={removeSkill}
            />
          )}
          {step === 2 && (
            <AvailabilityStep
              slots={form.availability} addSlot={addSlot} removeSlot={removeSlot}
            />
          )}
        </main>

        <footer className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || busy}
            className="btn-secondary"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="muted text-xs">Step {step + 1} of 3</div>
          {step < 2 ? (
            <button onClick={() => setStep((s) => Math.min(2, s + 1))} className="btn-primary" disabled={busy}>
              Next <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={() => finish(false)} disabled={busy} className="btn-primary">
              <Check className="h-4 w-4" /> {busy ? 'Saving…' : 'Finish'}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

function ProgressBar({ step }) {
  const labels = ['Profile', 'Skills', 'Availability'];
  return (
    <div className="flex items-center gap-2">
      {labels.map((l, i) => (
        <div key={l} className="flex flex-1 items-center gap-2">
          <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-semibold ${i < step ? 'border-ink-900 bg-ink-900 text-ink-50' : i === step ? 'border-ink-800 text-ink-900' : 'border-ink-200 text-ink-400'}`}>
            {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </div>
          <div className={`text-xs ${i === step ? 'font-semibold text-ink-900' : 'muted'}`}>{l}</div>
          {i < labels.length - 1 && <div className={`h-px flex-1 ${i < step ? 'bg-ink-900' : 'bg-ink-200'}`} />}
        </div>
      ))}
    </div>
  );
}

function ProfileStep({ form, setForm, fileRef, photoBusy, onPhoto }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Web Development');
  const [proficiency, setProficiency] = useState('intermediate');
  return (
    <>
      <h2 className="section-title">Tell us who you are</h2>
      <p className="muted text-sm">This is what other students see across the app.</p>

      <div className="flex items-center gap-4 rounded-xl border border-ink-200 p-3">
        <Avatar user={{ name: form.name, photo: { url: '' } }} size={64} />
        <div className="flex-1">
          <div className="text-sm font-semibold">{form.name || 'Your name'}</div>
          <div className="muted text-xs">PNG or JPG, up to 5 MB.</div>
        </div>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={photoBusy} className="btn-secondary">
          <Camera className="h-4 w-4" /> {photoBusy ? 'Uploading…' : 'Upload photo'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Full name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Aarav Sharma" />
        </div>
        <div>
          <label className="label">Department</label>
          <select className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
            {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Year</label>
          <input className="input" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="e.g. 2nd Year" />
        </div>
      </div>
      <div>
        <label className="label">Short bio</label>
        <textarea rows={3} className="input" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="One line about you and what you love building." />
      </div>
    </>
  );
}

function SkillsStep({ form, addSkill, removeSkill }) {
  const [teachName, setTeachName] = useState('');
  const [teachCat, setTeachCat] = useState('Web Development');
  const [teachProf, setTeachProf] = useState('intermediate');
  const [learnName, setLearnName] = useState('');
  const [learnCat, setLearnCat] = useState('Other');
  const [learnProf, setLearnProf] = useState('beginner');

  return (
    <>
      <h2 className="section-title">What can you teach, and what do you want to learn?</h2>
      <p className="muted text-sm">At least one of each unlocks matches. You can edit these later.</p>

      <section>
        <h3 className="text-sm font-semibold">Skills you can TEACH</h3>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <div className="min-w-[10rem] flex-1">
            <label className="label">Skill</label>
            <input className="input" value={teachName} onChange={(e) => setTeachName(e.target.value)} placeholder="e.g. React" />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={teachCat} onChange={(e) => setTeachCat(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Level</label>
            <select className="input" value={teachProf} onChange={(e) => setTeachProf(e.target.value)}>
              {LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
          <button type="button" onClick={() => { if (!teachName.trim()) return; addSkill('teach')({ name: teachName.trim(), category: teachCat, proficiency: teachProf }); setTeachName(''); }} className="btn-primary">Add</button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {form.skillsCanTeach.length === 0 ? <span className="muted text-xs">Nothing yet.</span> :
            form.skillsCanTeach.map((s) => (
              <Chip key={s.name} onRemove={() => removeSkill('teach')(s.name)}>{s.name} · {s.proficiency}</Chip>
            ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold">Skills you want to LEARN</h3>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <div className="min-w-[10rem] flex-1">
            <label className="label">Skill</label>
            <input className="input" value={learnName} onChange={(e) => setLearnName(e.target.value)} placeholder="e.g. Figma" />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={learnCat} onChange={(e) => setLearnCat(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Level</label>
            <select className="input" value={learnProf} onChange={(e) => setLearnProf(e.target.value)}>
              {LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
          <button type="button" onClick={() => { if (!learnName.trim()) return; addSkill('learn')({ name: learnName.trim(), category: learnCat, proficiency: learnProf }); setLearnName(''); }} className="btn-primary">Add</button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {form.skillsToLearn.length === 0 ? <span className="muted text-xs">Nothing yet.</span> :
            form.skillsToLearn.map((s) => (
              <Chip key={s.name} onRemove={() => removeSkill('learn')(s.name)}>{s.name} · {s.proficiency}</Chip>
            ))}
        </div>
      </section>
    </>
  );
}

function AvailabilityStep({ slots, addSlot, removeSlot }) {
  const [day, setDay] = useState('Mon');
  const [start, setStart] = useState('18:00');
  const [end, setEnd] = useState('20:00');

  return (
    <>
      <h2 className="section-title">When are you free?</h2>
      <p className="muted text-sm">Add a few weekly slots. Matches prioritise peers with overlapping availability.</p>

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
        <button type="button" onClick={() => {
          if (start >= end) { toast.error('End must be after start'); return; }
          addSlot({ day, start, end });
        }} className="btn-primary">Add slot</button>
      </div>

      <ul className="divide-y divide-ink-100 rounded-xl border border-ink-200">
        {slots.length === 0 ? <li className="px-3 py-2 text-xs muted">Nothing yet.</li> :
          slots.map((s, i) => (
            <li key={i} className="flex items-center justify-between px-3 py-2 text-sm">
              <span><b>{s.day}</b> · {s.start}–{s.end}</span>
              <button onClick={() => removeSlot(i)} className="text-xs text-ink-500 hover:text-ink-900">remove</button>
            </li>
          ))}
      </ul>
    </>
  );
}
