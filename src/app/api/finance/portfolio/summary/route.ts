import {
  readPortfolioHoldings,
  readPortfolioTransactions,
} from "@/feature/finance/lib/sheets-helpers";
import { getSpreadsheetId } from "../../_helpers";
import type {
  PortfolioHoldingWithPrice,
  PortfolioSummary,
} from "@/feature/finance/types";

// GET /api/finance/portfolio/summary
export async function GET() {
  const result = await getSpreadsheetId();
  if ("error" in result)
    return Response.json({ error: result.error }, { status: result.status });

  try {
    const [holdings, transactions] = await Promise.all([
      readPortfolioHoldings(result.spreadsheetId, result.serviceAccountKey),
      readPortfolioTransactions(result.spreadsheetId, result.serviceAccountKey),
    ]);

    if (holdings.length === 0) {
      const empty: PortfolioSummary = {
        totalCostBasis: 0,
        totalCurrentValue: 0,
        totalUnrealizedPnl: 0,
        totalUnrealizedPnlPct: 0,
        totalDividends: 0,
        holdings: [],
        bySector: [],
        byExchange: [],
      };
      return Response.json(empty);
    }

    // Prices are read directly from the GOOGLEFINANCE formulas in the holdings sheet

    // Calculate total dividends
    const totalDividends = transactions
      .filter((t) => t.type === "dividend")
      .reduce((sum, t) => sum + t.price * t.shares, 0);

    // Build enriched holdings
    const enriched: PortfolioHoldingWithPrice[] = holdings.map((h) => {
      const currentPrice = h.currentPrice;
      const previousClose = h.previousClose;
      const changePercent = h.changePercent;
      const currentValue = currentPrice * h.shares;
      const costBasis = h.avgPrice * h.shares;
      const unrealizedPnl = currentValue - costBasis;
      const unrealizedPnlPct =
        costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : 0;

      return {
        ...h,
        currentPrice,
        previousClose,
        changePercent,
        currentValue,
        costBasis,
        unrealizedPnl,
        unrealizedPnlPct,
        priceError: currentPrice === 0,
      };
    });

    const totalCostBasis = enriched.reduce((s, h) => s + h.costBasis, 0);
    const totalCurrentValue = enriched.reduce((s, h) => s + h.currentValue, 0);
    const totalUnrealizedPnl = totalCurrentValue - totalCostBasis;
    const totalUnrealizedPnlPct =
      totalCostBasis > 0 ? (totalUnrealizedPnl / totalCostBasis) * 100 : 0;

    // Group by sector
    const sectorMap = new Map<string, number>();
    for (const h of enriched) {
      const key = h.sector || "Other";
      sectorMap.set(key, (sectorMap.get(key) ?? 0) + h.currentValue);
    }
    const bySector = [...sectorMap.entries()].map(([sector, value]) => ({
      sector,
      value,
      pct: totalCurrentValue > 0 ? (value / totalCurrentValue) * 100 : 0,
    }));

    // Group by exchange
    const exchangeMap = new Map<string, number>();
    for (const h of enriched) {
      const key = h.exchange || "Other";
      exchangeMap.set(key, (exchangeMap.get(key) ?? 0) + h.currentValue);
    }
    const byExchange = [...exchangeMap.entries()].map(([exchange, value]) => ({
      exchange,
      value,
      pct: totalCurrentValue > 0 ? (value / totalCurrentValue) * 100 : 0,
    }));

    const summary: PortfolioSummary = {
      totalCostBasis,
      totalCurrentValue,
      totalUnrealizedPnl,
      totalUnrealizedPnlPct,
      totalDividends,
      holdings: enriched,
      bySector,
      byExchange,
    };

    return Response.json(summary);
  } catch (err) {
    console.error("[portfolio/summary] error:", err);
    return Response.json(
      { error: "Failed to compute portfolio summary" },
      { status: 500 },
    );
  }
}
