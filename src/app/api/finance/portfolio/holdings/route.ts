import { nanoid } from "nanoid";
import type { NextRequest } from "next/server";
import {
  appendPortfolioHolding,
  readPortfolioHoldings,
} from "@/feature/finance/lib/sheets-helpers";
import { getSpreadsheetId } from "../../_helpers";

// GET /api/finance/portfolio/holdings
export async function GET() {
  const result = await getSpreadsheetId();
  if ("error" in result)
    return Response.json({ error: result.error }, { status: result.status });

  try {
    const holdings = await readPortfolioHoldings(
      result.spreadsheetId,
      result.serviceAccountKey,
    );
    return Response.json({ holdings });
  } catch (err) {
    console.error("[portfolio/holdings GET] error:", err);
    return Response.json(
      { error: "Failed to read portfolio holdings" },
      { status: 500 },
    );
  }
}

// POST /api/finance/portfolio/holdings
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

  const {
    ticker,
    name,
    exchange,
    lots,
    shares,
    avgPrice,
    currency,
    sector,
    purchaseDate,
    notes,
  } = body as Record<string, string | number>;

  if (!ticker || !avgPrice) {
    return Response.json(
      { error: "ticker and avgPrice are required" },
      { status: 400 },
    );
  }

  const tickerStr = String(ticker).toUpperCase().trim();
  const now = new Date().toISOString();

  const isIDX = tickerStr.endsWith(".JK");
  const finalTicker = isIDX ? tickerStr.slice(0, -3) : tickerStr;

  const row = [
    nanoid(10),
    finalTicker,
    String(name ?? ""),
    String(exchange ?? "IDX"),
    String(lots ?? 0),
    String(shares ?? 0),
    String(avgPrice),
    String(currency ?? "IDR"),
    String(sector ?? ""),
    String(purchaseDate ?? now.slice(0, 10)),
    String(notes ?? ""),
    now,
    now,
    "FALSE",
    `=GOOGLEFINANCE("${isIDX ? "IDX:" : ""}${finalTicker}","price")`,
    `=GOOGLEFINANCE("${isIDX ? "IDX:" : ""}${finalTicker}","closeyest")`,
    `=GOOGLEFINANCE("${isIDX ? "IDX:" : ""}${finalTicker}","changepct")`,
  ];

  try {
    await appendPortfolioHolding(
      result.spreadsheetId,
      row,
      result.serviceAccountKey,
    );
    return Response.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[portfolio/holdings POST] error:", err);
    return Response.json(
      { error: "Failed to add portfolio holding" },
      { status: 500 },
    );
  }
}
