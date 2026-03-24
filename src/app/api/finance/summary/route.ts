import type { NextRequest } from "next/server";
import { readTransactions } from "@/feature/finance/lib/sheets-helpers";
import type {
  CategorySummary,
  Summary,
  SummaryMonth,
} from "@/feature/finance/types";
import { getSpreadsheetId } from "../_helpers";

// GET /api/finance/summary?range=monthly|yearly
export async function GET(request: NextRequest) {
  const result = await getSpreadsheetId();
  if ("error" in result)
    return Response.json({ error: result.error }, { status: result.status });

  const range = request.nextUrl.searchParams.get("range") ?? "monthly";

  try {
    const [transactions] = await Promise.all([
      readTransactions(result.spreadsheetId, 2000, 0, result.serviceAccountKey),
    ]);

    const monthlyMap = new Map<string, SummaryMonth>();
    const categoryMap = new Map<string, CategorySummary>();

    let totalIncome = 0;
    let totalExpense = 0;

    for (const tx of transactions) {
      if (tx.deleted === "TRUE") continue;

      const monthKey =
        range === "yearly" ? tx.date.slice(0, 4) : tx.date.slice(0, 7);

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthKey,
          income: 0,
          expense: 0,
          net: 0,
        });
      }
      // biome-ignore lint/style/noNonNullAssertion: key was just set above
      const m = monthlyMap.get(monthKey)!;

      if (tx.type === "income") {
        m.income += tx.amount;
        totalIncome += tx.amount;
      } else if (tx.type === "expense") {
        m.expense += tx.amount;
        totalExpense += tx.amount;
        const catKey = tx.category || "Uncategorized";
        if (!categoryMap.has(catKey)) {
          categoryMap.set(catKey, {
            category: catKey,
            total: 0,
            type: "expense",
          });
        }
        // biome-ignore lint/style/noNonNullAssertion: key was just set above
        categoryMap.get(catKey)!.total += tx.amount;
      }
      m.net = m.income - m.expense;
    }

    const summary: Summary = {
      monthly: Array.from(monthlyMap.values()).sort((a, b) =>
        a.month.localeCompare(b.month),
      ),
      byCategory: Array.from(categoryMap.values()).sort(
        (a, b) => b.total - a.total,
      ),
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
    };

    return Response.json(summary);
  } catch (err) {
    console.error("[summary GET] error:", err);
    return Response.json(
      { error: "Failed to compute summary" },
      { status: 500 },
    );
  }
}
