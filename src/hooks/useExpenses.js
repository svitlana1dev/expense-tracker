import { useState, useEffect } from 'react';
import { mockExpenses } from '../data/mockExpenses';

const STORAGE_KEY = 'expense-tracker-v1';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : mockExpenses;
  } catch {
    return mockExpenses;
  }
}

function persist(expenses) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch {}
}

export function useExpenses() {
  const [expenses, setExpenses] = useState(load);

  useEffect(() => {
    persist(expenses);
  }, [expenses]);

  const addExpense = (expense) =>
    setExpenses((prev) => [expense, ...prev]);

  const deleteExpense = (id) =>
    setExpenses((prev) => prev.filter((e) => e.id !== id));

  const clearExpenses = () => setExpenses([]);

  return { expenses, addExpense, deleteExpense, clearExpenses };
}
