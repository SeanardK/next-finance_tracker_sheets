import { nanoid } from "nanoid";
import type { NextRequest } from "next/server";
import {
  appendTransaction,
  readTransactions,
} from "@/feature/finance/lib/sheets-helpers";
import { getSpreadsheetId } from "../_helpers";

// GET /api/finance/transactions?limit=200&offset=0
export async function GET(request: NextRequest) {
  const result = await getSpreadsheetId();
  if ("error" in result)
    return Response.json({ error: result.error }, { status: result.status });

  const { searchParams } = request.nextUrl;
  const limit = Math.min(Number(searchParams.get("limit") ?? 200), 500);
  const offset = Number(searchParams.get("offset") ?? 0);

  try {
    const transactions = await readTransactions(
      result.spreadsheetId,
      limit,
      offset,
      result.serviceAccountKey,
    );
    return Response.json({ transactions, limit, offset });
  } catch (err) {
    console.error("[transactions GET] error:", err);
    return Response.json(
      { error: "Failed to read transactions" },
      { status: 500 },
    );
  }
}

// POST /api/finance/transactions
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

  const { date, account, category, amount, currency, type, description, tags } =
    body as Record<string, string>;

  if (!date || !amount || !type) {
    return Response.json(
      { error: "date, account, amount, and type are required" },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const row = [
    date,
    account,
    category ?? "",
    String(amount),
    currency ?? "IDR",
    type,
    description ?? "",
    tags ?? "",
    nanoid(10),
    now,
    now,
    "FALSE",
  ];

  try {
    await appendTransaction(
      result.spreadsheetId,
      row,
      result.serviceAccountKey,
    );
    return Response.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[transactions POST] error:", err);
    return Response.json(
      { error: "Failed to append transaction" },
      { status: 500 },
    );
  }
}
