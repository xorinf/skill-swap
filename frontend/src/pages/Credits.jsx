import { useEffect, useState } from 'react';
import { useApi } from '../lib/api.js';
import { Section, Stat, Empty, Chip } from '../components/ui.jsx';
import { relativeTime } from '../components/ui.jsx';
import { PageHeader } from '../components/PageHeader.jsx';

export default function Credits() {
  const api = useApi();
  const [data, setData] = useState({ balance: 0, transactions: [] });

  useEffect(() => { api.get('/credits/history').then((r) => setData(r.data)).catch(() => {}); }, [api]);

  const earned = data.transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const spent = data.transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div className="space-y-4">
      <PageHeader title="Time Credits" subtitle="Your balance and full transaction history." />
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Current balance" value={data.balance} />
        <Stat label="Total earned" value={earned} />
        <Stat label="Total spent" value={spent} />
      </div>

      <Section title="Transaction history">
        {data.transactions.length === 0 ? <Empty title="No transactions yet" body="Earn credits by teaching. Spend them to learn." /> : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-left text-xs uppercase tracking-wide muted">
                <tr><th className="px-4 py-2">When</th><th className="px-4 py-2">Type</th><th className="px-4 py-2">Reason</th><th className="px-4 py-2 text-right">Amount</th><th className="px-4 py-2 text-right">Balance</th></tr>
              </thead>
              <tbody>
                {data.transactions.map((t) => (
                  <tr key={t._id} className="border-t border-ink-100">
                    <td className="px-4 py-2 text-xs muted">{relativeTime(t.createdAt)}</td>
                    <td className="px-4 py-2"><Chip>{t.type.replace(/_/g, ' ')}</Chip></td>
                    <td className="px-4 py-2 text-xs">{t.reason}</td>
                    <td className={`px-4 py-2 text-right font-mono ${t.amount > 0 ? 'text-ink-900' : 'text-ink-500'}`}>{t.amount > 0 ? `+${t.amount}` : t.amount}</td>
                    <td className="px-4 py-2 text-right font-mono">{t.balanceAfter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
