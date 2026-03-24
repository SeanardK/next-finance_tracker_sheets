import { nanoid } from "nanoid";
import type { NextRequest } from "next/server";
import Papa from "papaparse";
import {
  appendTransaction,
  readTransactions,
} from "@/feature/finance/lib/sheets-helpers";
import { getSpreadsheetId } from "../_helpers";

// GET /api/finance/import-export  →  CSV export
export async function GET() {
  const result = await getSpreadsheetId();
  if ("error" in result)
    return Response.json({ error: result.error }, { status: result.status });

  try {
    const transactions = await readTransactions(
      result.spreadsheetId,
      5000,
      0,
      result.serviceAccountKey,
    );
    const csv = Papa.unparse(
      transactions.map(({ rowIndex: _r, ...rest }) => rest),
    );
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="transactions-${Date.now()}.csv"`,
      },
    });
  } catch (err) {
    console.error("[import-export GET] error:", err);
    return Response.json({ error: "Failed to export" }, { status: 500 });
  }
}

// POST /api/finance/import-export
export async function POST(request: NextRequest) {
  const result = await getSpreadsheetId();
  if ("error" in result)
    return Response.json({ error: result.error }, { status: result.status });

  let csvText: string;
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("text/csv") || contentType.includes("text/plain")) {
    csvText = await request.text();
  } else if (contentType.includes("application/json")) {
    const body = (await request.json()) as { csv?: string };
    csvText = body.csv ?? "";
  } else {
    return Response.json(
      {
        error:
          "Unsupported content type. Send text/csv or application/json with {csv: '...'}",
      },
      { status: 415 },
    );
  }

  if (!csvText.trim()) {
    return Response.json({ error: "Empty CSV" }, { status: 400 });
  }

  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    return Response.json(
      { error: "CSV parse error", details: parsed.errors },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  let imported = 0;

  for (const row of parsed.data) {
    const txRow = [
      row.date ?? row.Date ?? "",
      row.account ?? row.Account ?? "",
      row.category ?? row.Category ?? "",
      String(row.amount ?? row.Amount ?? "0"),
      row.currency ?? row.Currency ?? "IDR",
      row.type ?? row.Type ?? "expense",
      row.description ?? row.Description ?? "",
      row.tags ?? row.Tags ?? "",
      row.externalId ?? row.ExternalId ?? nanoid(10),
      row.createdAt ?? row.CreatedAt ?? now,
      now,
      "FALSE",
    ];
    try {
      await appendTransaction(
        result.spreadsheetId,
        txRow,
        result.serviceAccountKey,
      );
      imported++;
    } catch (err) {
      console.error("[import-export POST] row error:", err);
    }
  }

  return Response.json({ ok: true, imported });
}
