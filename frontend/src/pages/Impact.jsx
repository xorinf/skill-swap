import { useEffect, useState } from 'react';
import { useApi } from '../lib/api.js';
import { Section, Stat, Chip } from '../components/ui.jsx';
import { PageHeader, Spinner, PageError } from '../components/PageHeader.jsx';

export default function Impact() {
  const api = useApi();
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => { api.get('/impact/me').then((r) => setD(r.data.impact)).catch((e) => setErr(e.message)); }, [api]);

  if (err) return <PageError title="Couldn't load your impact" body={err} />;
  if (!d) return <div className="space-y-4"><PageHeader title="Your impact" /><Spinner label="Crunching the numbers…" /></div>;
  return (
    <div className="space-y-4">
      <PageHeader
        title={`${d.name.split(' ')[0]}'s impact`}
        subtitle="A snapshot of what you've taught, learned, and earned on campus."
      />

      <div className="card flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-sm text-ink-600">{d.department || 'Anurag University'} {d.year && `· ${d.year}`}</div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {d.badges?.length === 0 ? <span className="muted text-sm">No badges yet — keep showing up.</span> : d.badges.map((b) => <Chip key={b} kind="ink">{b}</Chip>)}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Sessions completed" value={d.sessionsCompleted} />
        <Stat label="Hours exchanged" value={d.hoursExchanged} />
        <Stat label="Trust score" value={d.trustScore} />
        <Stat label="Time credits" value={d.timeCredits} />
        <Stat label="Sessions taught" value={d.sessionsTaught} />
        <Stat label="Sessions attended" value={d.sessionsAttended} />
        <Stat label="Skills taught" value={d.skillsTaught} />
        <Stat label="Rating" value={d.ratingsCount ? `${d.ratingAvg} (${d.ratingsCount})` : '—'} />
      </div>

      <Section title="What this means">
        <div className="card text-sm text-ink-700">
          You've exchanged <b>{d.hoursExchanged}</b> hours of peer-to-peer learning on campus. That's roughly the length of a 3-credit course — except the knowledge went both ways.
        </div>
      </Section>
    </div>
  );
}
