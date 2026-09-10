import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../lib/api.js';
import { useAuth } from '../state/AuthContext.jsx';
import { Avatar, Chip, Section, TrustBadge, Stat, Empty } from '../components/ui.jsx';
import { Spinner } from '../components/PageHeader.jsx';
import { MessageCircle, UserPlus } from 'lucide-react';

export default function Profile() {
  const { user: me } = useAuth();
  const api = useApi();
  const params = useParams();
  const isMe = !params.id;
  const [profile, setProfile] = useState(isMe ? me : null);
  const [sessions, setSessions] = useState({ upcoming: [], past: [] });

  const load = async () => {
    if (isMe) {
      setProfile(me);
      const r = await api.get('/sessions/mine').catch(() => ({ data: { upcoming: [], past: [] } }));
      setSessions({ upcoming: r.data.upcoming, past: r.data.past });
    } else {
      const r = await api.get(`/users/${params.id}`);
      setProfile(r.data.user);
    }
  };

  useEffect(() => { load(); }, [params.id]);

  if (!profile) return <div className="space-y-4"><Spinner label="Loading profile…" /></div>;

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar user={profile} size={88} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="section-title">{profile.name}</h1>
              <TrustBadge score={profile.trustScore} />
            </div>
            <div className="muted text-sm">{profile.department || 'Anurag University'}{profile.year ? ` · ${profile.year}` : ''}</div>
            <p className="mt-3 max-w-2xl text-sm">{profile.bio || 'No bio yet.'}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.badges?.map((b) => <Chip key={b} kind="ink">{b}</Chip>)}
            </div>
          </div>
          {isMe ? (
            <Link to="/profile/edit" className="btn-secondary">Edit profile</Link>
          ) : (
            <div className="flex gap-2">
              <Link to={`/messages/with/${profile._id}`} className="btn-secondary"><MessageCircle className="h-4 w-4" />Message</Link>
              <Link to={`/matches/${profile._id}`} className="btn-primary"><UserPlus className="h-4 w-4" />View match</Link>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Trust" value={profile.trustScore} />
        <Stat label="Sessions" value={profile.sessionsAttended || 0} />
        <Stat label="Rating" value={profile.ratingsCount ? `${profile.ratingAvg} (${profile.ratingsCount})` : '—'} />
        <Stat label="Time credits" value={profile.timeCredits} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Teaches">
          {profile.skillsCanTeach?.length === 0 ? <Empty title="No skills yet" body={isMe ? 'Add what you can teach.' : ''} /> : (
            <div className="flex flex-wrap gap-2">
              {profile.skillsCanTeach.map((s) => <Chip key={s.name} kind="ink">{s.name} · {s.proficiency || 'intermediate'}</Chip>)}
            </div>
          )}
        </Section>
        <Section title="Wants to learn">
          {profile.skillsToLearn?.length === 0 ? <Empty title="No interests yet" body="" /> : (
            <div className="flex flex-wrap gap-2">
              {profile.skillsToLearn.map((s) => <Chip key={s.name}>{s.name} · {s.proficiency || 'beginner'}</Chip>)}
            </div>
          )}
        </Section>
        <Section title="Availability">
          {profile.availability?.length === 0 ? <Empty title="No slots shared" body={isMe ? 'Add when you are free to swap.' : ''} /> : (
            <ul className="space-y-1 text-sm">
              {profile.availability.map((a, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Chip>{a.day}</Chip>
                  <span>{a.start}–{a.end}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
        {isMe && (
          <Section title="Session history">
            {sessions.past.length === 0 ? <Empty title="No completed sessions yet" body="Complete a swap to see it here." /> : (
              <ul className="space-y-1 text-sm">
                {sessions.past.slice(0, 5).map((s) => (
                  <li key={s._id}><Link to={`/sessions/${s._id}`} className="hover:underline">{s.teachSkill} ↔ {s.learnSkill} · {new Date(s.scheduledStart).toLocaleDateString()}</Link></li>
                ))}
              </ul>
            )}
          </Section>
        )}
      </div>
    </div>
  );
}
