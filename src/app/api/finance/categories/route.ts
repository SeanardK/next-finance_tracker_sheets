import { nanoid } from "nanoid";
import type { NextRequest } from "next/server";
import {
  appendCategory,
  readCategories,
} from "@/feature/finance/lib/sheets-helpers";
import { getSpreadsheetId } from "../_helpers";

// GET /api/finance/categories
export async function GET() {
  const result = await getSpreadsheetId();
  if ("error" in result)
    return Response.json({ error: result.error }, { status: result.status });

  try {
    const categories = await readCategories(
      result.spreadsheetId,
      result.serviceAccountKey,
    );
    return Response.json({ categories });
  } catch (err) {
    console.error("[categories GET] error:", err);
    return Response.json(
      { error: "Failed to read categories" },
      { status: 500 },
    );
  }
}

// POST /api/finance/categories
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

  const { name, parentId, type, color } = body as Record<string, string>;
  if (!name?.trim()) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  const row = [
    nanoid(10),
    name.trim(),
    parentId ?? "",
    type ?? "expense",
    color ?? "#868e96",
    new Date().toISOString(),
  ];

  try {
    await appendCategory(result.spreadsheetId, row, result.serviceAccountKey);
    return Response.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[categories POST] error:", err);
    return Response.json({ error: "Failed to add category" }, { status: 500 });
  }
}
