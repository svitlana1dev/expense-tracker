const fmt = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Math.abs(amount)
  );

export default function SummaryCard({ label, amount, type, icon }) {
  return (
    <div className={`summary-card summary-card--${type}`}>
      <div className="summary-card__header">
        <span className="summary-card__label">{label}</span>
        {icon && <span className="summary-card__icon">{icon}</span>}
      </div>
      <span className="summary-card__amount">{fmt(amount)}</span>
    </div>
  );
}
