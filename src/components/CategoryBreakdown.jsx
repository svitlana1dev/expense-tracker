import { useMemo } from 'react';

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const CATEGORY_META = {
  Food:          { icon: '🍽️', color: '#f97316' },
  Transport:     { icon: '🚗', color: '#3b82f6' },
  Entertainment: { icon: '🎬', color: '#8b5cf6' },
  Shopping:      { icon: '🛍️', color: '#ec4899' },
  Bills:         { icon: '💡', color: '#64748b' },
  Housing:       { icon: '🏠', color: '#6366f1' },
  Healthcare:    { icon: '💊', color: '#10b981' },
  Other:         { icon: '📌', color: '#94a3b8' },
};

export default function CategoryBreakdown({ expenses }) {
  const { rows, total } = useMemo(() => {
    const only = expenses.filter((e) => e.type === 'expense');
    const total = only.reduce((s, e) => s + e.amount, 0);
    const grouped = only.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});
    const rows = Object.entries(grouped).sort(([, a], [, b]) => b - a);
    return { rows, total };
  }, [expenses]);

  if (rows.length === 0) {
    return <p className="text-[13px] text-muted text-center py-3">No expense data yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {rows.map(([category, amount]) => {
        const pct = total > 0 ? (amount / total) * 100 : 0;
        const meta = CATEGORY_META[category] ?? CATEGORY_META.Other;

        return (
          <div key={category} className="flex flex-col gap-[5px]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[13px] font-medium text-text">
                <span className="text-sm">{meta.icon}</span>
                {category}
              </span>
              <span className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-text">{fmt(amount)}</span>
                <span className="text-[11px] text-muted min-w-[30px] text-right">{pct.toFixed(0)}%</span>
              </span>
            </div>
            <div className="h-[6px] bg-bg rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-[400ms]"
                style={{ width: `${pct}%`, background: meta.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
