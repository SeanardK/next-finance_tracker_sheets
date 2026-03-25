import {
  readPortfolioHoldings,
  readPortfolioTransactions,
} from "@/feature/finance/lib/sheets-helpers";
import { getSpreadsheetId } from "../../_helpers";
import type { MarketQuote } from "../market-price/route";
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

    // Fetch market prices via Alpha Vantage
    const tickers = [...new Set(holdings.map((h) => h.ticker))];
    const validTickers = tickers.filter((t) => /^[A-Z0-9.\-^]{1,20}$/.test(t));
    const apiKey = result.alphaVantageKey;

    const priceMap: Map<string, MarketQuote> = new Map();
    if (validTickers.length > 0 && apiKey) {
      const priceResults = await Promise.allSettled(
        validTickers.map(async (ticker) => {
          // Alpha Vantage uses .JKT for Jakarta; Yahoo uses .JK
          const avSymbol = ticker.endsWith(".JK")
            ? `${ticker.slice(0, -3)}.JKT`
            : ticker;
          const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(avSymbol)}&apikey=${encodeURIComponent(apiKey)}`;
          const res = await fetch(url, { next: { revalidate: 300 } });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = (await res.json()) as {
            "Global Quote"?: Record<string, string>;
            Note?: string;
            Information?: string;
          };
          if (json.Note || json.Information) throw new Error("rate_limit");
          const q = json["Global Quote"];
          if (!q?.["05. price"]) throw new Error("No data");
          const price = Number.parseFloat(q["05. price"]);
          const previousClose = Number.parseFloat(
            q["08. previous close"] ?? "0",
          );
          const changePct = Number.parseFloat(
            (q["10. change percent"] ?? "0%").replace("%", ""),
          );
          return {
            ticker,
            price,
            previousClose,
            changePercent: changePct,
            currency: avSymbol.endsWith(".JKT") ? "IDR" : "USD",
            shortName: ticker,
            error: false,
          } satisfies MarketQuote;
        }),
      );
      for (const r of priceResults) {
        if (r.status === "fulfilled") {
          priceMap.set(r.value.ticker, r.value);
        }
      }
    }

    // Calculate total dividends
    const totalDividends = transactions
      .filter((t) => t.type === "dividend")
      .reduce((sum, t) => sum + t.price * t.shares, 0);

    // Build enriched holdings
    const enriched: PortfolioHoldingWithPrice[] = holdings.map((h) => {
      const quote = priceMap.get(h.ticker);
      const currentPrice = quote?.price ?? 0;
      const previousClose = quote?.previousClose ?? 0;
      const changePercent = quote?.changePercent ?? 0;
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
        priceError: quote?.error ?? true,
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
