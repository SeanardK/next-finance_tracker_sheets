import { nanoid } from "nanoid";
import type { NextRequest } from "next/server";
import {
  appendBudget,
  readBudgets,
  readTransactions,
} from "@/feature/finance/lib/sheets-helpers";
import type { BudgetWithActual } from "@/feature/finance/types";
import { getSpreadsheetId } from "../_helpers";

// GET /api/finance/budgets?month=YYYY-MM
export async function GET(request: NextRequest) {
  const result = await getSpreadsheetId();
  if ("error" in result)
    return Response.json({ error: result.error }, { status: result.status });

  const month =
    request.nextUrl.searchParams.get("month") ??
    new Date().toISOString().slice(0, 7);

  try {
    const [allBudgets, transactions] = await Promise.all([
      readBudgets(result.spreadsheetId, result.serviceAccountKey),
      readTransactions(result.spreadsheetId, 2000, 0, result.serviceAccountKey),
    ]);

    const monthBudgets = allBudgets.filter((b) => b.month === month);

    // Compute actual per category for this month
    const actualMap = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.date.slice(0, 7) !== month || !tx.category) continue;
      actualMap.set(tx.category, (actualMap.get(tx.category) ?? 0) + tx.amount);
    }

    const budgets: BudgetWithActual[] = monthBudgets.map((b) => {
      const actual = actualMap.get(b.category) ?? 0;
      const remaining = b.amount - actual;
      const percentUsed = b.amount > 0 ? (actual / b.amount) * 100 : 0;
      return { ...b, actual, remaining, percentUsed };
    });

    return Response.json({ budgets, month });
  } catch (err) {
    console.error("[budgets GET] error:", err);
    return Response.json({ error: "Failed to read budgets" }, { status: 500 });
  }
}

// POST /api/finance/budgets
export async function POST(request: NextRequest) {
  const result = await getSpreadsheetId();
  if ("error" in result)
    return Response.json({ error: result.error }, { status: result.status });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { month, category, type, amount, currency } = body as Record<
    string,
    string
  >;
  if (!month || !category || !amount) {
    return Response.json(
      { error: "month, category, and amount are required" },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const row = [
    nanoid(10),
    month,
    category,
    type ?? "expense",
    String(amount),
    currency ?? "IDR",
    now,
    now,
  ];

  try {
    await appendBudget(result.spreadsheetId, row, result.serviceAccountKey);
    return Response.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[budgets POST] error:", err);
    return Response.json({ error: "Failed to add budget" }, { status: 500 });
  }
}
