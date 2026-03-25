import type { NextRequest } from "next/server";
import { readPortfolioHoldings } from "@/feature/finance/lib/sheets-helpers";
import { getSpreadsheetId } from "../../_helpers";

export interface MarketQuote {
  ticker: string;
  price: number;
  previousClose: number;
  changePercent: number;
  currency: string;
  shortName: string;
  error?: boolean;
}

// GET /api/finance/portfolio/market-price?tickers=BBCA.JK,AAPL
// Prices are read from the GOOGLEFINANCE formulas stored in the holdings sheet.
export async function GET(request: NextRequest) {
  const result = await getSpreadsheetId();
  if ("error" in result)
    return Response.json({ error: result.error }, { status: result.status });

  const tickersParam = request.nextUrl.searchParams.get("tickers") ?? "";
  if (!tickersParam.trim())
    return Response.json(
      { error: "tickers parameter is required" },
      { status: 400 },
    );

  const requested = new Set(
    tickersParam
      .split(",")
      .map((t) => t.trim().toUpperCase())
      .filter((t) => /^[A-Z0-9.\-^]{1,20}$/.test(t)),
  );

  try {
    const holdings = await readPortfolioHoldings(
      result.spreadsheetId,
      result.serviceAccountKey,
    );

    const quotes: MarketQuote[] = [...requested].map((ticker) => {
      const holding = holdings.find((h) => h.ticker === ticker);
      return {
        ticker,
        price: holding?.currentPrice ?? 0,
        previousClose: holding?.previousClose ?? 0,
        changePercent: holding?.changePercent ?? 0,
        currency: holding?.currency ?? (ticker.endsWith(".JK") ? "IDR" : "USD"),
        shortName: holding?.name || ticker,
        error: !holding || holding.currentPrice === 0,
      };
    });

    return Response.json({ quotes });
  } catch (err) {
    console.error("[portfolio/market-price] error:", err);
    return Response.json(
      { error: "Failed to fetch market prices" },
      { status: 500 },
    );
  }
}
