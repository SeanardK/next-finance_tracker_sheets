import {
  readPortfolioHoldings,
  readPortfolioTransactions,
} from "@/feature/finance/lib/sheets-helpers";
import { getSpreadsheetId } from "../../_helpers";
import type {
  PortfolioAssetType,
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
        byAssetType: [],
      };
      return Response.json(empty);
    }

    const totalDividends = transactions
      .filter((t) => ["dividend", "interest", "coupon"].includes(t.type))
      .reduce((sum, t) => sum + t.price * t.shares, 0);

    const enriched: PortfolioHoldingWithPrice[] = holdings.map((h) => {
      const currentPrice = h.currentPrice;
      const previousClose = h.previousClose;
      const changePercent = h.changePercent;
      const priceError = currentPrice <= 0;
      const costBasis = h.avgPrice * h.shares;
      const currentValue = priceError ? costBasis : currentPrice * h.shares;
      const unrealizedPnl = priceError ? 0 : currentValue - costBasis;
      const unrealizedPnlPct = priceError
        ? 0
        : costBasis > 0
          ? (unrealizedPnl / costBasis) * 100
          : 0;

      return {
        ...h,
        currentPrice,
        previousClose,
        changePercent,
        currentValue,
        costBasis,
        unrealizedPnl,
        unrealizedPnlPct,
        priceError,
      };
    });

    const totalCostBasis = enriched.reduce((s, h) => s + h.costBasis, 0);
    const totalCurrentValue = enriched.reduce((s, h) => s + h.currentValue, 0);
    const pricedCostBasis = enriched
      .filter((h) => !h.priceError)
      .reduce((s, h) => s + h.costBasis, 0);
    const pricedCurrentValue = enriched
      .filter((h) => !h.priceError)
      .reduce((s, h) => s + h.currentValue, 0);
    const totalUnrealizedPnl = pricedCurrentValue - pricedCostBasis;
    const totalUnrealizedPnlPct =
      pricedCostBasis > 0 ? (totalUnrealizedPnl / pricedCostBasis) * 100 : 0;

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

    const assetTypeMap = new Map<string, number>();
    for (const h of enriched) {
      const key = h.assetType || "stock";
      assetTypeMap.set(key, (assetTypeMap.get(key) ?? 0) + h.currentValue);
    }
    const byAssetType = [...assetTypeMap.entries()].map(
      ([assetType, value]) => ({
        assetType: assetType as PortfolioAssetType,
        value,
        pct: totalCurrentValue > 0 ? (value / totalCurrentValue) * 100 : 0,
      }),
    );

    const summary: PortfolioSummary = {
      totalCostBasis,
      totalCurrentValue,
      totalUnrealizedPnl,
      totalUnrealizedPnlPct,
      totalDividends,
      holdings: enriched,
      bySector,
      byExchange,
      byAssetType,
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
