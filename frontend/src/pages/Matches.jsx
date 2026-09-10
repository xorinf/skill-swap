import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../lib/api.js';
import { Avatar, Chip, Section, Empty, TrustBadge } from '../components/ui.jsx';
import { PageHeader } from '../components/PageHeader.jsx';

export default function Matches() {
  const api = useApi();
  const [params, setParams] = useSearchParams();
  const [matches, setMatches] = useState([]);
  const q = params.get('q') || '';

  useEffect(() => {
    api.get(`/matches${q ? `?q=${encodeURIComponent(q)}` : ''}`).then((r) => setMatches(r.data.matches)).catch(() => {});
  }, [q, api]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={q ? `Matches for "${q}"` : 'All recommended peers'}
        subtitle="Ranked by skill compatibility, availability overlap, and trust score."
      />
      <div className="card flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[12rem]">
          <label className="label">Filter by skill</label>
          <input className="input" value={q} placeholder="e.g. React, Figma, Python" onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {})} />
        </div>
      </div>
      <Section title={q ? `Matches for "${q}"` : 'All recommended peers'}>
        {matches.length === 0 ? <Empty title="No matches" body="Try changing your skills or query." /> : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {matches.map((m) => (
              <Link key={m.user._id} to={`/matches/${m.user._id}`} className="card block hover:border-ink-300">
                <div className="flex items-start gap-3">
                  <Avatar user={m.user} size={48} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-base font-semibold">{m.user.name}</div>
                      <div className="rounded-full border border-ink-800 px-2 py-0.5 text-xs font-semibold">{m.match.score}%</div>
                    </div>
                    <div className="muted truncate text-xs">{m.user.department || 'Anurag University'}{m.user.year ? ` · ${m.user.year}` : ''}</div>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-xs muted">{m.user.bio || 'No bio yet.'}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {m.user.skillsCanTeach.slice(0, 4).map((s) => <Chip key={s.name}>teaches {s.name}</Chip>)}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs muted">
                  <TrustBadge score={m.user.trustScore} />
                  <span>★ {m.user.ratingAvg || '—'} ({m.user.ratingsCount || 0})</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
