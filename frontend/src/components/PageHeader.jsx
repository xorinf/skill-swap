// Shared page chrome: PageHeader for hero title, Spinner for the loading state.
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PageHeader({ title, subtitle, action, back = false }) {
  const nav = useNavigate();
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-center gap-3">
        {back && (
          <button onClick={() => nav(-1)} className="rounded-lg border border-ink-200 bg-white p-2 text-ink-700 hover:bg-ink-50" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <div>
          <h1 className="section-title">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-ink-600">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 gap-2">{action}</div>}
    </div>
  );
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="card flex items-center gap-3 text-ink-700">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-ink-200 border-t-ink-800" />
      <span>{label}</span>
    </div>
  );
}

export function PageError({ title = 'Something went wrong', body, action }) {
  return (
    <div className="card border-red-200">
      <div className="text-base font-semibold text-red-700">{title}</div>
      {body && <p className="mt-1 text-sm text-ink-600">{body}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
