import { auth, clerkClient } from "@clerk/nextjs/server";

export async function getSpreadsheetId(): Promise<
  | { spreadsheetId: string; serviceAccountKey: string; userId: string }
  | { error: string; status: number }
> {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized", status: 401 };

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const meta = user.privateMetadata as Record<string, unknown>;

  const spreadsheetId = meta.spreadsheetId as string | undefined;
  const serviceAccountKey = meta.serviceAccountKey as string | undefined;

  if (!spreadsheetId) {
    return {
      error:
        "Spreadsheet not configured. Go to Settings to set up your Google Sheet.",
      status: 400,
    };
  }

  if (!serviceAccountKey) {
    return {
      error:
        "Google credentials not configured. Go to Settings to add your Service Account key.",
      status: 400,
    };
  }

  return { spreadsheetId, serviceAccountKey, userId };
}
