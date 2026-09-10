export function Avatar({ user, size = 40 }) {
  if (!user) return null;
  const dim = { width: size, height: size };
  if (user.photo?.url) return <img {...dim} className="rounded-full object-cover" src={user.photo.url} alt={user.name} />;
  const initials = (user.name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div {...dim} className="grid place-items-center rounded-full border border-ink-200 bg-ink-100 text-sm font-semibold text-ink-700">
      {initials}
    </div>
  );
}

export function Chip({ children, onRemove, kind = 'default' }) {
  const cls = kind === 'ink' ? 'chip-ink' : 'chip';
  return (
    <span className={cls}>
      {children}
      {onRemove && (
        <button onClick={onRemove} className="text-ink-400 hover:text-ink-800" aria-label="remove">×</button>
      )}
    </span>
  );
}

export function Section({ title, action, children }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="section-title text-xl">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Empty({ title, body, action }) {
  return (
    <div className="card text-center">
      <div className="text-base font-semibold text-ink-800">{title}</div>
      <div className="mt-1 text-sm muted">{body}</div>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Stat({ label, value }) {
  return (
    <div className="card flex flex-col">
      <div className="text-xs uppercase tracking-wide muted">{label}</div>
      <div className="mt-1 text-2xl font-bold text-ink-900">{value}</div>
    </div>
  );
}

export function TrustBadge({ score }) {
  if (score == null) return null;
  const color = score >= 80 ? 'border-ink-800' : score >= 60 ? 'border-ink-400' : 'border-ink-300';
  return <span className={`chip border-2 ${color}`}>Trust {score}</span>;
}

export function StarRating({ value = 0, onChange, readOnly = false, size = 16 }) {
  return (
    <div className="inline-flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => !readOnly && onChange?.(n)}
          className={`p-0.5 ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
          aria-label={`${n} star`}
        >
          <svg width={size} height={size} viewBox="0 0 24 24" fill={n <= Math.round(value) ? '#191917' : 'none'} stroke="#191917" strokeWidth="1.5">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77 5.82 21l1.18-6.88-5-4.87 6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export function relativeTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}
