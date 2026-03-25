import type { NextRequest } from "next/server";
import {
  readAccounts,
  readBudgets,
  readTransactions,
} from "@/feature/finance/lib/sheets-helpers";
import type { AccountBalance } from "@/feature/finance/types";
import { getSpreadsheetId } from "../../_helpers";

// GET /api/finance/accounts/balance?month=YYYY-MM
export async function GET(request: NextRequest) {
  const result = await getSpreadsheetId();
  if ("error" in result)
    return Response.json({ error: result.error }, { status: result.status });

  const month =
    request.nextUrl.searchParams.get("month") ??
    new Date().toISOString().slice(0, 7);

  try {
    const [accounts, transactions, budgets] = await Promise.all([
      readAccounts(result.spreadsheetId, result.serviceAccountKey),
      readTransactions(result.spreadsheetId, 5000, 0, result.serviceAccountKey),
      readBudgets(result.spreadsheetId, result.serviceAccountKey),
    ]);

    // Build per-account all-time income/expense maps
    const incomeMap = new Map<string, number>();
    const expenseMap = new Map<string, number>();
    const monthSpentMap = new Map<string, number>();
    const currencyMap = new Map<string, string>();

    for (const tx of transactions) {
      const acct = tx.account || "";
      if (!acct) continue;
      currencyMap.set(acct, tx.currency || "IDR");
      if (tx.type === "income") {
        incomeMap.set(acct, (incomeMap.get(acct) ?? 0) + tx.amount);
      } else if (tx.type === "expense") {
        expenseMap.set(acct, (expenseMap.get(acct) ?? 0) + tx.amount);
        if (tx.date.slice(0, 7) === month) {
          monthSpentMap.set(acct, (monthSpentMap.get(acct) ?? 0) + tx.amount);
        }
      }
    }

    // Budget allocated for this month, per account
    // Strategy:
    //   1. Budgets with a specific account → assigned directly to that account
    //   2. Budgets with account="" (all accounts) → distribute proportionally by spending share
    const monthBudgets = budgets.filter(
      (b) => b.month === month && b.type === "expense",
    );

    // Direct per-account budgets
    const directBudgetMap = new Map<string, number>();
    let proportionalBudgetTotal = 0;
    for (const b of monthBudgets) {
      if (b.account) {
        directBudgetMap.set(
          b.account,
          (directBudgetMap.get(b.account) ?? 0) + b.amount,
        );
      } else {
        proportionalBudgetTotal += b.amount;
      }
    }

    // Proportional distribution of unassigned budgets by spending share
    const totalMonthSpent = Array.from(monthSpentMap.values()).reduce(
      (s, v) => s + v,
      0,
    );

    const balances: AccountBalance[] = accounts.map((acct) => {
      const totalIncome = incomeMap.get(acct.name) ?? 0;
      const totalExpense = expenseMap.get(acct.name) ?? 0;
      const monthSpent = monthSpentMap.get(acct.name) ?? 0;
      const currency = currencyMap.get(acct.name) ?? "IDR";

      // Direct budget + proportional share of unassigned budgets
      const direct = directBudgetMap.get(acct.name) ?? 0;
      const share = totalMonthSpent > 0 ? monthSpent / totalMonthSpent : 0;
      const proportional = Math.round(proportionalBudgetTotal * share);
      const monthBudgeted = direct + proportional;
      const monthRemaining = monthBudgeted - monthSpent;

      return {
        account: acct.name,
        color: acct.color,
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense,
        monthBudgeted,
        monthSpent,
        monthRemaining,
        currency,
      };
    });

    // Also include accounts that have transactions but aren't in the accounts list
    const knownNames = new Set(accounts.map((a) => a.name));

    function buildUnknownBalance(acct: string) {
      const totalIncome = incomeMap.get(acct) ?? 0;
      const totalExpense = expenseMap.get(acct) ?? 0;
      const monthSpent = monthSpentMap.get(acct) ?? 0;
      const direct = directBudgetMap.get(acct) ?? 0;
      const share = totalMonthSpent > 0 ? monthSpent / totalMonthSpent : 0;
      const monthBudgeted =
        direct + Math.round(proportionalBudgetTotal * share);
      return {
        account: acct,
        color: "#868e96",
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense,
        monthBudgeted,
        monthSpent,
        monthRemaining: monthBudgeted - monthSpent,
        currency: currencyMap.get(acct) ?? "IDR",
      };
    }

    for (const [acct] of incomeMap) {
      if (!knownNames.has(acct)) balances.push(buildUnknownBalance(acct));
    }
    for (const [acct] of expenseMap) {
      if (!knownNames.has(acct) && !incomeMap.has(acct))
        balances.push(buildUnknownBalance(acct));
    }

    return Response.json({ balances, month });
  } catch (err) {
    console.error("[accounts/balance GET] error:", err);
    return Response.json(
      { error: "Failed to compute account balances" },
      { status: 500 },
    );
  }
}
