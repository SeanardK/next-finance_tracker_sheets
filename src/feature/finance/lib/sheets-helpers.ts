import type { Category, Transaction } from "../types";
import {
  CAT_COLS,
  CAT_HEADERS,
  META_HEADERS,
  TX_COLS,
  TX_HEADERS,
} from "../types";
import { getSheetsClient, withBackoff } from "./google-sheets";

//  Provision

export async function initSpreadsheet(
  spreadsheetId: string,
  serviceAccountKey: string,
): Promise<void> {
  const sheets = getSheetsClient(serviceAccountKey);

  const meta = await withBackoff(() =>
    sheets.spreadsheets.get({ spreadsheetId }),
  );

  const existingSheets = new Set(
    (meta.data.sheets ?? []).map((s) => s.properties?.title),
  );

  const required = ["transactions", "categories", "meta"];
  const missing = required.filter((s) => !existingSheets.has(s));

  if (missing.length > 0) {
    await withBackoff(() =>
      sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: missing.map((title) => ({
            addSheet: { properties: { title } },
          })),
        },
      }),
    );
  }

  const headerData: { range: string; values: string[][] }[] = [];
  if (missing.includes("transactions"))
    headerData.push({ range: "transactions!A1", values: [TX_HEADERS] });
  if (missing.includes("categories"))
    headerData.push({ range: "categories!A1", values: [CAT_HEADERS] });
  if (missing.includes("meta"))
    headerData.push({ range: "meta!A1", values: [META_HEADERS] });

  if (headerData.length > 0) {
    await withBackoff(() =>
      sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: { valueInputOption: "RAW", data: headerData },
      }),
    );
  }
}

//  Transactions

export async function readTransactions(
  spreadsheetId: string,
  limit = 200,
  offset = 0,
  serviceAccountKey?: string,
): Promise<Transaction[]> {
  const sheets = getSheetsClient(serviceAccountKey);
  const res = await withBackoff(() =>
    sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "transactions!A2:L",
    }),
  );

  const rows = res.data.values ?? [];
  return rows
    .slice(offset, offset + limit)
    .map((row, idx) => rowToTransaction(row, offset + idx + 2))
    .filter((tx) => tx.deleted !== "TRUE");
}

export async function appendTransaction(
  spreadsheetId: string,
  row: string[],
  serviceAccountKey?: string,
): Promise<void> {
  const sheets = getSheetsClient(serviceAccountKey);
  await withBackoff(() =>
    sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "transactions!A:L",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    }),
  );
}

export async function updateTransactionRow(
  spreadsheetId: string,
  rowIndex: number,
  row: string[],
  serviceAccountKey?: string,
): Promise<void> {
  const sheets = getSheetsClient(serviceAccountKey);
  await withBackoff(() =>
    sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `transactions!A${rowIndex}:L${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: { values: [row] },
    }),
  );
}

export async function deleteTransactionRow(
  spreadsheetId: string,
  rowIndex: number,
  serviceAccountKey?: string,
): Promise<void> {
  const sheets = getSheetsClient(serviceAccountKey);
  const now = new Date().toISOString();
  await withBackoff(() =>
    sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `transactions!K${rowIndex}:L${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: { values: [[now, "TRUE"]] },
    }),
  );
}

//  Categories

export async function readCategories(
  spreadsheetId: string,
  serviceAccountKey?: string,
): Promise<Category[]> {
  const sheets = getSheetsClient(serviceAccountKey);
  const res = await withBackoff(() =>
    sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "categories!A2:F",
    }),
  );
  return (res.data.values ?? []).map(rowToCategory);
}

export async function appendCategory(
  spreadsheetId: string,
  row: string[],
  serviceAccountKey?: string,
): Promise<void> {
  const sheets = getSheetsClient(serviceAccountKey);
  await withBackoff(() =>
    sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "categories!A:F",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    }),
  );
}

export async function updateCategoryRow(
  spreadsheetId: string,
  rowIndex: number,
  row: string[],
  serviceAccountKey?: string,
): Promise<void> {
  const sheets = getSheetsClient(serviceAccountKey);
  await withBackoff(() =>
    sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `categories!A${rowIndex}:F${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: { values: [row] },
    }),
  );
}

export async function deleteCategoryRow(
  spreadsheetId: string,
  rowIndex: number,
  serviceAccountKey?: string,
): Promise<void> {
  const sheets = getSheetsClient(serviceAccountKey);
  const sheetId = await getSheetId(
    spreadsheetId,
    "categories",
    serviceAccountKey,
  );
  await withBackoff(() =>
    sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: "ROWS",
                startIndex: rowIndex - 1,
                endIndex: rowIndex,
              },
            },
          },
        ],
      },
    }),
  );
}

//  Helpers

function rowToTransaction(row: string[], rowIndex: number): Transaction {
  return {
    rowIndex,
    date: row[TX_COLS.date] ?? "",
    category: row[TX_COLS.category] ?? "",
    amount: Number.parseFloat(row[TX_COLS.amount]) || 0,
    currency: row[TX_COLS.currency] ?? "IDR",
    type: (row[TX_COLS.type] as Transaction["type"]) ?? "expense",
    description: row[TX_COLS.description] ?? "",
    tags: row[TX_COLS.tags] ?? "",
    externalId: row[TX_COLS.externalId] ?? "",
    createdAt: row[TX_COLS.createdAt] ?? "",
    updatedAt: row[TX_COLS.updatedAt] ?? "",
    deleted: row[TX_COLS.deleted] ?? "",
  };
}

function rowToCategory(row: string[]): Category {
  return {
    id: row[CAT_COLS.id] ?? "",
    name: row[CAT_COLS.name] ?? "",
    parentId: row[CAT_COLS.parentId] ?? "",
    type: (row[CAT_COLS.type] as Category["type"]) ?? "expense",
    color: row[CAT_COLS.color] ?? "#868e96",
    createdAt: row[CAT_COLS.createdAt] ?? "",
  };
}

async function getSheetId(
  spreadsheetId: string,
  sheetTitle: string,
  serviceAccountKey?: string,
): Promise<number> {
  const sheets = getSheetsClient(serviceAccountKey);
  const res = await withBackoff(() =>
    sheets.spreadsheets.get({ spreadsheetId }),
  );
  const sheet = res.data.sheets?.find(
    (s) => s.properties?.title === sheetTitle,
  );
  return sheet?.properties?.sheetId ?? 0;
}
