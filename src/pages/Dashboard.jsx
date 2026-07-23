import { useState, useMemo } from "react";
import ChatWindow from "../components/ChatWindow";
import ChatInput from "../components/ChatInput";
import SummaryCards from "../components/SummaryCards";
import CategoryBreakdown from "../components/CategoryBreakdown";
import { useExpenses } from "../hooks/useExpenses";
import { parseExpenseViaApi } from "../services/expenseApi";

const THINKING_ID = "thinking";

const WELCOME = {
  id: 0,
  role: "ai",
  text: 'Hi! Track expenses by typing in plain English. Try "Spent $20 on pizza" or "Paid Netflix $15.99".',
};

const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Math.abs(n),
  );

export default function Dashboard() {
  const { expenses, addExpense } = useExpenses();
  const [messages, setMessages] = useState([WELCOME]);
  const [analyticsOpen, setAnalyticsOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  const totalIncome = useMemo(
    () =>
      expenses
        .filter((e) => e.type === "income")
        .reduce((s, e) => s + e.amount, 0),
    [expenses],
  );
  const totalExpenses = useMemo(
    () =>
      expenses
        .filter((e) => e.type === "expense")
        .reduce((s, e) => s + e.amount, 0),
    [expenses],
  );
  const balance = totalIncome - totalExpenses;

  const handleSend = async (text) => {
    if (loading) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", text },
      { id: THINKING_ID, role: "ai", thinking: true, text: "" },
    ]);
    setLoading(true);

    try {
      const parsed = await parseExpenseViaApi(text);
      addExpense({
        ...parsed,
        id: Date.now(),
        description: text,
        type: "expense",
      });
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== THINKING_ID),
        {
          id: Date.now() + 1,
          role: "ai",
          text: "Expense added successfully.",
          expense: parsed,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== THINKING_ID),
        {
          id: Date.now() + 1,
          role: "ai",
          text: err.message ?? "Something went wrong.",
          error: true,
          retryText: text,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-[820px] mx-auto bg-bg">
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-[62px] bg-surface border-b border-border shrink-0 gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xl">💬</span>
          <span className="text-base font-bold text-text tracking-tight">
            Expense Tracker
          </span>
        </div>

        <div className="flex items-center gap-4">
          {[
            {
              label: "Balance",
              value: fmt(balance),
              cls: balance < 0 ? "text-expense" : "text-text",
            },
            { label: "Income", value: fmt(totalIncome), cls: "text-income" },
            {
              label: "Expenses",
              value: fmt(totalExpenses),
              cls: "text-expense",
            },
          ].map(({ label, value, cls }, i, arr) => (
            <div key={label} className="flex items-center gap-4">
              <div className="flex flex-col items-end gap-px">
                <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted">
                  {label}
                </span>
                <span className={`text-sm font-bold tracking-tight ${cls}`}>
                  {value}
                </span>
              </div>
              {i < arr.length - 1 && <div className="w-px h-7 bg-border" />}
            </div>
          ))}
        </div>

        <button
          className={`flex items-center gap-[5px] px-3 py-1.5 border-[1.5px] rounded-full text-xs font-semibold shrink-0 cursor-pointer transition-all
            ${
              analyticsOpen
                ? "border-primary text-primary bg-primary/15"
                : "border-border text-muted bg-transparent hover:border-primary hover:text-primary hover:bg-primary/10"
            }`}
          onClick={() => setAnalyticsOpen((v) => !v)}
          aria-label="Toggle analytics"
        >
          <span>Analytics</span>
          <svg
            className={`transition-transform duration-200 ${analyticsOpen ? "rotate-180" : ""}`}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </header>

      {/* Analytics panel */}
      {analyticsOpen && (
        <div className="shrink-0 bg-surface border-b border-border px-6 py-4 max-h-[340px] overflow-y-auto custom-scroll">
          <SummaryCards expenses={expenses} />
          <div className="h-px bg-border my-3.5" />
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-[0.07em] text-muted mb-2.5">
              By Category
            </span>
            <CategoryBreakdown expenses={expenses} />
          </div>
        </div>
      )}

      {/* Chat */}
      <main className="flex-1 overflow-y-auto scroll-smooth custom-scroll">
        <ChatWindow messages={messages} onRetry={handleSend} />
      </main>

      {/* Input */}
      <footer className="shrink-0 bg-surface border-t border-border px-6 py-3.5">
        <ChatInput onSend={handleSend} disabled={loading} />
      </footer>
    </div>
  );
}
