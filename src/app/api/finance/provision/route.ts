import { auth, clerkClient } from "@clerk/nextjs/server";
import { initSpreadsheet } from "@/feature/finance/lib/sheets-helpers";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const meta = user.privateMetadata as Record<string, unknown>;

  const spreadsheetId = meta.spreadsheetId as string | undefined;
  const serviceAccountKey = meta.serviceAccountKey as string | undefined;

  if (!spreadsheetId) {
    return Response.json(
      { error: "No spreadsheet configured. Go to Settings first." },
      { status: 400 },
    );
  }

  if (!serviceAccountKey) {
    return Response.json(
      { error: "No Service Account key configured. Go to Settings first." },
      { status: 400 },
    );
  }

  try {
    await initSpreadsheet(spreadsheetId, serviceAccountKey);
    return Response.json({ spreadsheetId, ok: true });
  } catch (err) {
    console.error("[provision] error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to initialize spreadsheet";
    return Response.json({ error: message }, { status: 500 });
  }
}
