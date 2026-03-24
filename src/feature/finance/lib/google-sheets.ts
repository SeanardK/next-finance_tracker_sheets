import type { sheets_v4 } from "googleapis";
import { google } from "googleapis";

function getAuth(serviceAccountKey?: string) {
  const raw = serviceAccountKey ?? process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw)
    throw new Error(
      "No Google credentials found. Configure your Service Account key in Settings.",
    );

  let key: Record<string, unknown>;
  try {
    key = JSON.parse(raw);
  } catch {
    throw new Error("Google service account key is not valid JSON");
  }

  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });
}

export function getSheetsClient(serviceAccountKey?: string): sheets_v4.Sheets {
  const auth = getAuth(serviceAccountKey);
  return google.sheets({ version: "v4", auth });
}

export function getDriveAuth(serviceAccountKey?: string) {
  return getAuth(serviceAccountKey);
}

export async function withBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 5,
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: unknown) {
      const status =
        (err as { status?: number; code?: number })?.status ??
        (err as { status?: number; code?: number })?.code;
      const isRateLimited = status === 429 || status === 503;
      if (!isRateLimited || attempt >= maxRetries) throw err;
      const delay = Math.min(1000 * 2 ** attempt + Math.random() * 500, 30000);
      await new Promise((r) => setTimeout(r, delay));
      attempt++;
    }
  }
}
