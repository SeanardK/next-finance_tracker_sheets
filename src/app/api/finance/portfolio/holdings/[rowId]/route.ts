import type { NextRequest } from "next/server";
import {
  deletePortfolioHoldingRow,
  readPortfolioHoldings,
  updatePortfolioHoldingRow,
} from "@/feature/finance/lib/sheets-helpers";
import { getSpreadsheetId } from "../../../_helpers";

// PUT /api/finance/portfolio/holdings/[rowId]
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

  const holdings = await readPortfolioHoldings(
    result.spreadsheetId,
    result.serviceAccountKey,
  );
  const existing = holdings.find((h) => h.rowIndex === rowIndex);
  if (!existing)
    return Response.json({ error: "Holding not found" }, { status: 404 });

  const now = new Date().toISOString();
  const row = [
    existing.id,
    String(body.ticker ?? existing.ticker)
      .toUpperCase()
      .trim(),
    String(body.name ?? existing.name),
    String(body.exchange ?? existing.exchange),
    String(body.lots ?? existing.lots),
    String(body.shares ?? existing.shares),
    String(body.avgPrice ?? existing.avgPrice),
    String(body.currency ?? existing.currency),
    String(body.sector ?? existing.sector),
    String(body.purchaseDate ?? existing.purchaseDate),
    String(body.notes ?? existing.notes),
    existing.createdAt,
    now,
    "FALSE",
  ];

  try {
    await updatePortfolioHoldingRow(
      result.spreadsheetId,
      rowIndex,
      row,
      result.serviceAccountKey,
    );
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[portfolio/holdings PUT] error:", err);
    return Response.json(
      { error: "Failed to update holding" },
      { status: 500 },
    );
  }
}

// DELETE /api/finance/portfolio/holdings/[rowId]
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
    await deletePortfolioHoldingRow(
      result.spreadsheetId,
      rowIndex,
      result.serviceAccountKey,
    );
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[portfolio/holdings DELETE] error:", err);
    return Response.json(
      { error: "Failed to delete holding" },
      { status: 500 },
    );
  }
}
