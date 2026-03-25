import { auth, clerkClient } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

export interface MarketQuote {
  ticker: string;
  price: number;
  previousClose: number;
  changePercent: number;
  currency: string;
  shortName: string;
  error?: boolean;
}

/** Convert Yahoo-format ticker to Alpha Vantage format where needed. */
function toAvSymbol(ticker: string): string {
  // Yahoo uses .JK for Jakarta; Alpha Vantage uses .JKT
  if (ticker.endsWith(".JK")) return `${ticker.slice(0, -3)}.JKT`;
  return ticker;
}

async function fetchAvQuote(
  avSymbol: string,
  originalTicker: string,
  apiKey: string,
): Promise<MarketQuote> {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(avSymbol)}&apikey=${encodeURIComponent(apiKey)}`;
  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as {
      "Global Quote"?: Record<string, string>;
      Note?: string;
      Information?: string;
    };

    // Rate-limit or API key notice
    if (json.Note || json.Information) {
      console.warn(
        "[market-price] Alpha Vantage notice:",
        json.Note ?? json.Information,
      );
      throw new Error("rate_limit");
    }

    const q = json["Global Quote"];
    if (!q || !q["05. price"]) throw new Error("No data");

    const price = Number.parseFloat(q["05. price"]);
    const previousClose = Number.parseFloat(q["08. previous close"] ?? "0");
    const changePctStr = (q["10. change percent"] ?? "0%").replace("%", "");
    const changePercent = Number.parseFloat(changePctStr);

    return {
      ticker: originalTicker,
      price,
      previousClose,
      changePercent,
      currency: avSymbol.endsWith(".JKT") ? "IDR" : "USD",
      shortName: originalTicker,
      error: false,
    };
  } catch {
    return {
      ticker: originalTicker,
      price: 0,
      previousClose: 0,
      changePercent: 0,
      currency: "IDR",
      shortName: originalTicker,
      error: true,
    };
  }
}

// GET /api/finance/portfolio/market-price?tickers=BBCA.JK,AAPL
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const meta = user.privateMetadata as Record<string, unknown>;
  const apiKey = meta.alphaVantageKey as string | undefined;

  if (!apiKey) {
    return Response.json(
      {
        error:
          "Alpha Vantage API key not configured. Go to Settings to add it.",
      },
      { status: 400 },
    );
  }

  const tickersParam = request.nextUrl.searchParams.get("tickers") ?? "";
  if (!tickersParam.trim())
    return Response.json(
      { error: "tickers parameter is required" },
      { status: 400 },
    );

  // Sanitize tickers: only allow alphanumeric, dot, dash, caret
  const tickers = tickersParam
    .split(",")
    .map((t) => t.trim().toUpperCase())
    .filter((t) => /^[A-Z0-9.\-^]{1,20}$/.test(t))
    .slice(0, 30);

  if (tickers.length === 0)
    return Response.json(
      { error: "No valid tickers provided" },
      { status: 400 },
    );

  try {
    const quotes = await Promise.all(
      tickers.map((ticker) => fetchAvQuote(toAvSymbol(ticker), ticker, apiKey)),
    );
    return Response.json({ quotes });
  } catch (err) {
    console.error("[portfolio/market-price] error:", err);
    return Response.json(
      { error: "Failed to fetch market prices" },
      { status: 500 },
    );
  }
}
