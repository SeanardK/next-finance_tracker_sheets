import { nanoid } from "nanoid";
import type { NextRequest } from "next/server";
import {
  appendPortfolioTransaction,
  readPortfolioTransactions,
} from "@/feature/finance/lib/sheets-helpers";
import { getSpreadsheetId } from "../../_helpers";

// GET /api/finance/portfolio/transactions?ticker=BBCA
export async function GET(request: NextRequest) {
  const result = await getSpreadsheetId();
  if ("error" in result)
    return Response.json({ error: result.error }, { status: result.status });

  const ticker = request.nextUrl.searchParams.get("ticker") ?? "";

  try {
    let transactions = await readPortfolioTransactions(
      result.spreadsheetId,
      result.serviceAccountKey,
    );
    if (ticker) {
      transactions = transactions.filter(
        (t) => t.ticker.toUpperCase() === ticker.toUpperCase(),
      );
    }
    return Response.json({ transactions });
  } catch (err) {
    console.error("[portfolio/transactions GET] error:", err);
    return Response.json(
      { error: "Failed to read portfolio transactions" },
      { status: 500 },
    );
  }
}

// POST /api/finance/portfolio/transactions
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

  const { ticker, date, type, lots, shares, price, fee, currency, notes } =
    body as Record<string, string | number>;

  if (!ticker || !date || !type || !price) {
    return Response.json(
      { error: "ticker, date, type, and price are required" },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const row = [
    nanoid(10),
    String(ticker).toUpperCase().trim(),
    String(date),
    String(type),
    String(lots ?? 0),
    String(shares ?? 0),
    String(price),
    String(fee ?? 0),
    String(currency ?? "IDR"),
    String(notes ?? ""),
    now,
    now,
    "FALSE",
  ];

  try {
    await appendPortfolioTransaction(
      result.spreadsheetId,
      row,
      result.serviceAccountKey,
    );
    return Response.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[portfolio/transactions POST] error:", err);
    return Response.json(
      { error: "Failed to add portfolio transaction" },
      { status: 500 },
    );
  }
}
