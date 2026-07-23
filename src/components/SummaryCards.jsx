import { useMemo } from 'react';

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

function isThisMonth(dateStr) {
  const now = new Date();
  const d = new Date(dateStr + 'T00:00:00');
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

const ACCENT = {
  expense: {
    border: 'border-l-expense',
    value:  'text-expense',
  },
  primary: {
    border: 'border-l-primary',
    value:  'text-primary',
  },
  neutral: {
    border: 'border-l-border',
    value:  'text-text',
  },
};

function StatCard({ label, value, sub, accent }) {
  const a = ACCENT[accent];
  return (
    <div className={`bg-surface-2 rounded-lg p-4 flex flex-col gap-1 border-l-[3px] ${a.border}`}>
      <span className="text-[10px] font-bold uppercase tracking-[0.07em] text-muted">{label}</span>
      <span className={`text-xl font-bold tracking-tight ${a.value}`}>{value}</span>
      {sub && <span className="text-[11px] text-muted">{sub}</span>}
    </div>
  );
}

export default function SummaryCards({ expenses }) {
  const { total, thisMonth, txCount, avgTx } = useMemo(() => {
    const only = expenses.filter((e) => e.type === 'expense');
    const total = only.reduce((s, e) => s + e.amount, 0);
    const thisMonth = only.filter((e) => isThisMonth(e.date)).reduce((s, e) => s + e.amount, 0);
    const txCount = only.length;
    const avgTx = txCount ? total / txCount : 0;
    return { total, thisMonth, txCount, avgTx };
  }, [expenses]);

  const monthLabel = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard
        label="Total Expenses"
        value={fmt(total)}
        sub={`${txCount} transaction${txCount !== 1 ? 's' : ''}`}
        accent="expense"
      />
      <StatCard
        label="This Month"
        value={fmt(thisMonth)}
        sub={monthLabel}
        accent="primary"
      />
      <StatCard
        label="Avg / Transaction"
        value={fmt(avgTx)}
        sub="all time"
        accent="neutral"
      />
    </div>
  );
}
