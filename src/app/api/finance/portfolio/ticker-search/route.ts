import { auth, clerkClient } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

export interface TickerResult {
  symbol: string;
  shortname: string;
  longname: string;
  exchange: string;
  typeDisp: string;
}

function inferExchange(symbol: string): string {
  if (symbol.endsWith(".JK")) return "JKT";
  if (symbol.endsWith(".L")) return "LSE";
  if (symbol.endsWith(".HK")) return "HKG";
  if (symbol.endsWith(".SI")) return "SES";
  return "";
}

// GET /api/finance/portfolio/ticker-search?q=bbca
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q || q.length < 1) return Response.json({ results: [] });

  if (!/^[A-Za-z0-9.\-^ ]{1,40}$/.test(q))
    return Response.json({ results: [] });

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const meta = user.privateMetadata as Record<string, unknown>;
  const apiKey = meta.finnhubKey as string | undefined;

  if (!apiKey) {
    return Response.json(
      { results: [], error: "Finnhub API key not configured" },
      { status: 400 },
    );
  }

  const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(q)}&token=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return Response.json({ results: [] });

    const json = (await res.json()) as {
      count: number;
      result: {
        description: string;
        displaySymbol: string;
        symbol: string;
        type: string;
      }[];
    };

    const results: TickerResult[] = (json.result ?? [])
      .filter((r) => r.symbol)
      .slice(0, 10)
      .map((r) => {
        const sym = r.displaySymbol || r.symbol;
        return {
          symbol: sym,
          shortname: r.description,
          longname: r.description,
          exchange: inferExchange(sym),
          typeDisp: r.type,
        };
      });

    return Response.json({ results });
  } catch (err) {
    console.error("[ticker-search] error:", err);
    return Response.json({ results: [] });
  }
}
