import type { NextRequest } from "next/server";
import {
  deletePortfolioTransactionRow,
  readPortfolioTransactions,
  updatePortfolioTransactionRow,
} from "@/feature/finance/lib/sheets-helpers";
import { getSpreadsheetId } from "../../../_helpers";

// PUT /api/finance/portfolio/transactions/[rowId]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ rowId: string }> },
) {
  const result = await getSpreadsheetId();
  if ("error" in result)
    return Response.json({ error: result.error }, { status: result.status });

  const { rowId } = await params;
  const rowIndex = Number(rowId);
  if (!rowIndex || rowIndex < 2)
    return Response.json({ error: "Invalid rowId" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const transactions = await readPortfolioTransactions(
    result.spreadsheetId,
    result.serviceAccountKey,
  );
  const existing = transactions.find((t) => t.rowIndex === rowIndex);
  if (!existing)
    return Response.json({ error: "Transaction not found" }, { status: 404 });

  const now = new Date().toISOString();
  const row = [
    existing.id,
    String(body.ticker ?? existing.ticker)
      .toUpperCase()
      .trim(),
    String(body.date ?? existing.date),
    String(body.type ?? existing.type),
    String(body.lots ?? existing.lots),
    String(body.shares ?? existing.shares),
    String(body.price ?? existing.price),
    String(body.fee ?? existing.fee),
    String(body.currency ?? existing.currency),
    String(body.notes ?? existing.notes),
    existing.createdAt,
    now,
    "FALSE",
  ];

  try {
    await updatePortfolioTransactionRow(
      result.spreadsheetId,
      rowIndex,
      row,
      result.serviceAccountKey,
    );
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[portfolio/transactions PUT] error:", err);
    return Response.json(
      { error: "Failed to update transaction" },
      { status: 500 },
    );
  }
}

// DELETE /api/finance/portfolio/transactions/[rowId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ rowId: string }> },
) {
  const result = await getSpreadsheetId();
  if ("error" in result)
    return Response.json({ error: result.error }, { status: result.status });

  const { rowId } = await params;
  const rowIndex = Number(rowId);
  if (!rowIndex || rowIndex < 2)
    return Response.json({ error: "Invalid rowId" }, { status: 400 });

  try {
    await deletePortfolioTransactionRow(
      result.spreadsheetId,
      rowIndex,
      result.serviceAccountKey,
    );
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[portfolio/transactions DELETE] error:", err);
    return Response.json(
      { error: "Failed to delete transaction" },
      { status: 500 },
    );
  }
}
