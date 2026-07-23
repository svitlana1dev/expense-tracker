import { z } from "zod";

export const EXPENSE_CATEGORIES = [
  "Food",
  "Housing",
  "Transport",
  "Entertainment",
  "Utilities",
  "Healthcare",
  "Shopping",
  "Salary",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const ExpenseExtractionSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3),
  merchant: z.string().min(1),
  category: z.enum(EXPENSE_CATEGORIES),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  note: z.string().nullable(),
});

export type ExpenseExtraction = z.infer<typeof ExpenseExtractionSchema>;
