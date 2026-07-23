const CATEGORY_META = {
  Food:          { icon: '🍽️', color: '#f97316' },
  Transport:     { icon: '🚗', color: '#3b82f6' },
  Entertainment: { icon: '🎬', color: '#8b5cf6' },
  Shopping:      { icon: '🛍️', color: '#ec4899' },
  Healthcare:    { icon: '💊', color: '#10b981' },
  Housing:       { icon: '🏠', color: '#6366f1' },
  Utilities:     { icon: '💡', color: '#64748b' },
  Salary:        { icon: '💰', color: '#10b981' },
  Other:         { icon: '📌', color: '#94a3b8' },
};

function formatDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatAmount(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export default function ExpenseList({ expenses }) {
  if (expenses.length === 0) {
    return (
      <div className="expense-empty">
        <span className="expense-empty__icon">📭</span>
        <p>No transactions yet. Add one above.</p>
      </div>
    );
  }

  return (
    <ul className="expense-list">
      {expenses.map((expense) => {
        const meta = CATEGORY_META[expense.category] ?? CATEGORY_META.Other;
        return (
          <li key={expense.id} className="expense-item">
            <div
              className="expense-item__icon"
              style={{ background: meta.color + '18', color: meta.color }}
            >
              {meta.icon}
            </div>

            <div className="expense-item__info">
              <span className="expense-item__merchant">{expense.merchant}</span>
              <span className="expense-item__meta">
                <span
                  className="expense-item__badge"
                  style={{ background: meta.color + '18', color: meta.color }}
                >
                  {expense.category}
                </span>
                {formatDate(expense.date)}
              </span>
            </div>

            <div className="expense-item__right">
              <span className={`expense-item__amount expense-item__amount--${expense.type}`}>
                {expense.type === 'income' ? '+' : '-'}{formatAmount(expense.amount)}
              </span>
              <span className="expense-item__desc">{expense.description}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
