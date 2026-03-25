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

async function fetchFinnhubQuote(
  symbol: string,
  apiKey: string,
): Promise<MarketQuote> {
  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(apiKey)}`;
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as {
      c: number;
      d: number;
      dp: number;
      h: number;
      l: number;
      o: number;
      pc: number;
      t: number;
    };
    if (!json.c && json.c !== 0) throw new Error("No data");
    return {
      ticker: symbol,
      price: json.c,
      previousClose: json.pc,
      changePercent: json.dp,
      currency: symbol.endsWith(".JK") ? "IDR" : "USD",
      shortName: symbol,
      error: false,
    };
  } catch {
    return {
      ticker: symbol,
      price: 0,
      previousClose: 0,
      changePercent: 0,
      currency: symbol.endsWith(".JK") ? "IDR" : "USD",
      shortName: symbol,
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
  const apiKey = meta.finnhubKey as string | undefined;

  if (!apiKey) {
    return Response.json(
      {
        error: "Finnhub API key not configured. Go to Settings to add it.",
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
      tickers.map((ticker) => fetchFinnhubQuote(ticker, apiKey)),
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
