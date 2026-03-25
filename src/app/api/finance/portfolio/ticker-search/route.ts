import type { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

export interface TickerResult {
  symbol: string;
  shortname: string;
  longname: string;
  exchange: string;
  typeDisp: string;
}

// GET /api/finance/portfolio/ticker-search?q=bbca
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q || q.length < 1) return Response.json({ results: [] });

  // Sanitize: only allow safe search characters
  if (!/^[A-Za-z0-9.\-^ ]{1,40}$/.test(q))
    return Response.json({ results: [] });

  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0&listsCount=0`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return Response.json({ results: [] });
    }

    const json = (await res.json()) as {
      quotes?: {
        symbol?: string;
        shortname?: string;
        longname?: string;
        exchange?: string;
        typeDisp?: string;
      }[];
    };

    const results: TickerResult[] = (json.quotes ?? [])
      .filter((q) => q.symbol && q.typeDisp !== "Future")
      .map((q) => ({
        symbol: q.symbol ?? "",
        shortname: q.shortname ?? q.longname ?? q.symbol ?? "",
        longname: q.longname ?? q.shortname ?? "",
        exchange: q.exchange ?? "",
        typeDisp: q.typeDisp ?? "",
      }));

    return Response.json({ results });
  } catch (err) {
    console.error("[ticker-search] error:", err);
    return Response.json({ results: [] });
  }
}
