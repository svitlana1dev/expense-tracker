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

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const fmtDate = (iso) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

function ExpenseCard({ expense }) {
  const meta = CATEGORY_META[expense.category] ?? CATEGORY_META.Other;
  return (
    <div className="bg-surface border-[1.5px] border-border rounded-[14px] overflow-hidden shadow-sm max-w-[280px]">
      <div
        className="flex items-center gap-2 px-3.5 py-2.5 text-[13px] font-bold bg-bg border-b border-border"
        style={{ color: meta.color }}
      >
        <span>{meta.icon}</span>
        <span>{expense.category}</span>
      </div>
      <div className="py-1">
        {[
          { label: 'Amount',   value: fmt(expense.amount),      cls: 'text-expense text-[15px]' },
          { label: 'Merchant', value: expense.merchant,          cls: 'text-text' },
          { label: 'Date',     value: fmtDate(expense.date),     cls: 'text-text' },
        ].map(({ label, value, cls }, i, arr) => (
          <div
            key={label}
            className={`flex justify-between items-center px-3.5 py-[7px] text-[13px] ${i < arr.length - 1 ? 'border-b border-border' : ''}`}
          >
            <span className="text-muted text-xs">{label}</span>
            <span className={`font-semibold ${cls}`}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIAvatar() {
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-gradient-to-br from-fuchsia-500 to-purple-700 text-white">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 0 2h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1 0-2h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2zm-3 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
      </svg>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex gap-2.5 items-start">
      <AIAvatar />
      <div className="flex items-center gap-[5px] px-[18px] py-3.5 bg-surface shadow-sm rounded-[4px_16px_16px_16px]">
        {[0, 0.15, 0.3].map((delay) => (
          <span
            key={delay}
            className="w-[7px] h-[7px] rounded-full bg-muted"
            style={{ animation: `thinking-bounce 1.2s ${delay}s infinite ease-in-out` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ChatMessage({ message }) {
  if (message.thinking) return <ThinkingBubble />;

  if (message.role === 'user') {
    return (
      <div className="flex gap-2.5 flex-row-reverse">
        <div className="px-4 py-3 text-sm leading-relaxed bg-primary text-white rounded-[16px_4px_16px_16px] max-w-[68%] break-words">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 items-start">
      <AIAvatar />
      <div className="flex flex-col gap-2 max-w-[82%]">
        <div
          className={`px-4 py-3 text-sm leading-relaxed shadow-sm rounded-[4px_16px_16px_16px]
            ${message.error
              ? 'bg-expense/10 border border-expense/30 text-expense'
              : 'bg-surface text-text'
            }`}
        >
          {message.text}
        </div>
        {message.expense && <ExpenseCard expense={message.expense} />}
      </div>
    </div>
  );
}
