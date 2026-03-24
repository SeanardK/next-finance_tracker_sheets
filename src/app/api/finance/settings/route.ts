import { auth, clerkClient } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

// GET /api/finance/settings
export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const meta = user.privateMetadata as Record<string, unknown>;

  return Response.json({
    spreadsheetId: (meta.spreadsheetId as string) ?? null,
    hasServiceAccountKey: !!(meta.serviceAccountKey as string),
  });
}

// POST /api/finance/settings
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { spreadsheetId, serviceAccountKey } = body as {
    spreadsheetId?: string;
    serviceAccountKey?: string;
  };

  if (!spreadsheetId?.trim()) {
    return Response.json(
      { error: "spreadsheetId is required" },
      { status: 400 },
    );
  }

  if (serviceAccountKey) {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(serviceAccountKey) as Record<string, unknown>;
    } catch {
      return Response.json(
        { error: "serviceAccountKey must be valid JSON" },
        { status: 400 },
      );
    }
    if (parsed.type !== "service_account") {
      return Response.json(
        { error: 'serviceAccountKey must be a "service_account" JSON key' },
        { status: 400 },
      );
    }
  }

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const existing = user.privateMetadata as Record<string, unknown>;

  const updates: Record<string, unknown> = {
    ...existing,
    spreadsheetId: spreadsheetId.trim(),
  };

  if (serviceAccountKey) {
    updates.serviceAccountKey = serviceAccountKey.trim();
  }

  await clerk.users.updateUserMetadata(userId, { privateMetadata: updates });

  return Response.json({ ok: true });
}
