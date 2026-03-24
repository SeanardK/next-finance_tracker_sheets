import type { NextRequest } from "next/server";
import {
  deleteAccountRow,
  updateAccountRow,
} from "@/feature/finance/lib/sheets-helpers";
import { getSpreadsheetId } from "../../_helpers";

type Ctx = { params: Promise<{ rowId: string }> };

// PUT /api/finance/accounts/[rowId]
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

  const row = [
    String(body.id ?? ""),
    String(body.name ?? ""),
    String(body.type ?? "bank"),
    String(body.color ?? "#868e96"),
    String(body.createdAt ?? new Date().toISOString()),
  ];

  try {
    await updateAccountRow(
      result.spreadsheetId,
      rowIndex,
      row,
      result.serviceAccountKey,
    );
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[accounts PUT] error:", err);
    return Response.json(
      { error: "Failed to update account" },
      { status: 500 },
    );
  }
}

// DELETE /api/finance/accounts/[rowId]
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
    await deleteAccountRow(
      result.spreadsheetId,
      rowIndex,
      result.serviceAccountKey,
    );
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[accounts DELETE] error:", err);
    return Response.json(
      { error: "Failed to delete account" },
      { status: 500 },
    );
  }
}
