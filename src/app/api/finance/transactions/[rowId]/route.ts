import type { NextRequest } from "next/server";
import {
  deleteTransactionRow,
  updateTransactionRow,
} from "@/feature/finance/lib/sheets-helpers";
import { getSpreadsheetId } from "../../_helpers";

type Ctx = { params: Promise<{ rowId: string }> };

// PUT /api/finance/transactions/[rowId]
export async function PUT(request: NextRequest, { params }: Ctx) {
  const result = await getSpreadsheetId();
  if ("error" in result)
    return Response.json({ error: result.error }, { status: result.status });

  const { rowId } = await params;
  const rowIndex = Number(rowId);
  if (!rowIndex || rowIndex < 2) {
    return Response.json({ error: "Invalid rowId" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const row = [
    String(body.date ?? ""),
    String(body.account ?? ""),
    String(body.category ?? ""),
    String(body.amount ?? "0"),
    String(body.currency ?? "IDR"),
    String(body.type ?? "expense"),
    String(body.description ?? ""),
    String(body.tags ?? ""),
    String(body.externalId ?? ""),
    String(body.createdAt ?? now),
    now,
    "FALSE",
  ];

  try {
    await updateTransactionRow(
      result.spreadsheetId,
      rowIndex,
      row,
      result.serviceAccountKey,
    );
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[transactions PUT] error:", err);
    return Response.json(
      { error: "Failed to update transaction" },
      { status: 500 },
    );
  }
}

// DELETE /api/finance/transactions/[rowId]
export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const result = await getSpreadsheetId();
  if ("error" in result)
    return Response.json({ error: result.error }, { status: result.status });

  const { rowId } = await params;
  const rowIndex = Number(rowId);
  if (!rowIndex || rowIndex < 2) {
    return Response.json({ error: "Invalid rowId" }, { status: 400 });
  }

  try {
    await deleteTransactionRow(
      result.spreadsheetId,
      rowIndex,
      result.serviceAccountKey,
    );
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[transactions DELETE] error:", err);
    return Response.json(
      { error: "Failed to delete transaction" },
      { status: 500 },
    );
  }
}
