import type {
  Account,
  Budget,
  Category,
  PortfolioHolding,
  PortfolioTransaction,
  Transaction,
} from "../types";
import {
  ACCT_COLS,
  ACCT_HEADERS,
  BUDGET_COLS,
  BUDGET_HEADERS,
  CAT_COLS,
  CAT_HEADERS,
  META_HEADERS,
  PORTFOLIO_HOLDING_COLS,
  PORTFOLIO_HOLDING_HEADERS,
  PORTFOLIO_TX_COLS,
  PORTFOLIO_TX_HEADERS,
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

  const required = [
    "transactions",
    "categories",
    "accounts",
    "budgets",
    "meta",
    "portfolio_holdings",
    "portfolio_transactions",
  ];
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
  if (missing.includes("accounts"))
    headerData.push({ range: "accounts!A1", values: [ACCT_HEADERS] });
  if (missing.includes("budgets"))
    headerData.push({ range: "budgets!A1", values: [BUDGET_HEADERS] });
  if (missing.includes("meta"))
    headerData.push({ range: "meta!A1", values: [META_HEADERS] });
  if (missing.includes("portfolio_holdings"))
    headerData.push({
      range: "portfolio_holdings!A1",
      values: [PORTFOLIO_HOLDING_HEADERS],
    });
  if (missing.includes("portfolio_transactions"))
    headerData.push({
      range: "portfolio_transactions!A1",
      values: [PORTFOLIO_TX_HEADERS],
    });

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
    account: row[TX_COLS.account] ?? "",
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

//  Accounts

export async function readAccounts(
  spreadsheetId: string,
  serviceAccountKey?: string,
): Promise<Account[]> {
  const sheets = getSheetsClient(serviceAccountKey);
  const res = await withBackoff(() =>
    sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "accounts!A2:E",
    }),
  );
  return (res.data.values ?? []).map((row, idx) => rowToAccount(row, idx + 2));
}

export async function appendAccount(
  spreadsheetId: string,
  row: string[],
  serviceAccountKey?: string,
): Promise<void> {
  const sheets = getSheetsClient(serviceAccountKey);
  await withBackoff(() =>
    sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "accounts!A:E",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    }),
  );
}

export async function updateAccountRow(
  spreadsheetId: string,
  rowIndex: number,
  row: string[],
  serviceAccountKey?: string,
): Promise<void> {
  const sheets = getSheetsClient(serviceAccountKey);
  await withBackoff(() =>
    sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `accounts!A${rowIndex}:E${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: { values: [row] },
    }),
  );
}

export async function deleteAccountRow(
  spreadsheetId: string,
  rowIndex: number,
  serviceAccountKey?: string,
): Promise<void> {
  const sheets = getSheetsClient(serviceAccountKey);
  const sheetId = await getSheetId(
    spreadsheetId,
    "accounts",
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

function rowToAccount(row: string[], rowIndex: number): Account {
  return {
    rowIndex,
    id: row[ACCT_COLS.id] ?? "",
    name: row[ACCT_COLS.name] ?? "",
    type: (row[ACCT_COLS.type] as Account["type"]) ?? "bank",
    color: row[ACCT_COLS.color] ?? "#868e96",
    createdAt: row[ACCT_COLS.createdAt] ?? "",
  };
}

//  Budgets

export async function readBudgets(
  spreadsheetId: string,
  serviceAccountKey?: string,
): Promise<Budget[]> {
  const sheets = getSheetsClient(serviceAccountKey);
  const res = await withBackoff(() =>
    sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "budgets!A2:I",
    }),
  );
  return (res.data.values ?? []).map((row, idx) => rowToBudget(row, idx + 2));
}

export async function appendBudget(
  spreadsheetId: string,
  row: string[],
  serviceAccountKey?: string,
): Promise<void> {
  const sheets = getSheetsClient(serviceAccountKey);
  await withBackoff(() =>
    sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "budgets!A:I",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    }),
  );
}

export async function updateBudgetRow(
  spreadsheetId: string,
  rowIndex: number,
  row: string[],
  serviceAccountKey?: string,
): Promise<void> {
  const sheets = getSheetsClient(serviceAccountKey);
  await withBackoff(() =>
    sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `budgets!A${rowIndex}:I${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: { values: [row] },
    }),
  );
}

export async function deleteBudgetRow(
  spreadsheetId: string,
  rowIndex: number,
  serviceAccountKey?: string,
): Promise<void> {
  const sheets = getSheetsClient(serviceAccountKey);
  const sheetId = await getSheetId(spreadsheetId, "budgets", serviceAccountKey);
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

function rowToBudget(row: string[], rowIndex: number): Budget {
  return {
    rowIndex,
    id: row[BUDGET_COLS.id] ?? "",
    month: row[BUDGET_COLS.month] ?? "",
    category: row[BUDGET_COLS.category] ?? "",
    type: (row[BUDGET_COLS.type] as Budget["type"]) ?? "expense",
    amount: Number.parseFloat(row[BUDGET_COLS.amount]) || 0,
    currency: row[BUDGET_COLS.currency] ?? "IDR",
    createdAt: row[BUDGET_COLS.createdAt] ?? "",
    updatedAt: row[BUDGET_COLS.updatedAt] ?? "",
    account: row[BUDGET_COLS.account] ?? "",
  };
}

//  Portfolio Holdings

export async function readPortfolioHoldings(
  spreadsheetId: string,
  serviceAccountKey?: string,
): Promise<PortfolioHolding[]> {
  const sheets = getSheetsClient(serviceAccountKey);
  const res = await withBackoff(() =>
    sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "portfolio_holdings!A2:R",
      valueRenderOption: "UNFORMATTED_VALUE",
    }),
  );
  return (res.data.values ?? [])
    .map((row, idx) => rowToPortfolioHolding(row, idx + 2))
    .filter((h) => h.deleted !== "TRUE");
}

export async function appendPortfolioHolding(
  spreadsheetId: string,
  row: string[],
  serviceAccountKey?: string,
): Promise<void> {
  const sheets = getSheetsClient(serviceAccountKey);
  await withBackoff(() =>
    sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "portfolio_holdings!A:R",
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    }),
  );
}

export async function updatePortfolioHoldingRow(
  spreadsheetId: string,
  rowIndex: number,
  row: string[],
  serviceAccountKey?: string,
): Promise<void> {
  const sheets = getSheetsClient(serviceAccountKey);
  await withBackoff(() =>
    sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `portfolio_holdings!A${rowIndex}:R${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    }),
  );
}

export async function deletePortfolioHoldingRow(
  spreadsheetId: string,
  rowIndex: number,
  serviceAccountKey?: string,
): Promise<void> {
  const sheets = getSheetsClient(serviceAccountKey);
  const now = new Date().toISOString();
  await withBackoff(() =>
    sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `portfolio_holdings!M${rowIndex}:N${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: { values: [[now, "TRUE"]] },
    }),
  );
}

function rowToPortfolioHolding(
  row: string[],
  rowIndex: number,
): PortfolioHolding {
  return {
    rowIndex,
    id: row[PORTFOLIO_HOLDING_COLS.id] ?? "",
    ticker: row[PORTFOLIO_HOLDING_COLS.ticker] ?? "",
    name: row[PORTFOLIO_HOLDING_COLS.name] ?? "",
    exchange: row[PORTFOLIO_HOLDING_COLS.exchange] ?? "",
    lots: Number.parseFloat(row[PORTFOLIO_HOLDING_COLS.lots]) || 0,
    shares: Number.parseFloat(row[PORTFOLIO_HOLDING_COLS.shares]) || 0,
    avgPrice: Number.parseFloat(row[PORTFOLIO_HOLDING_COLS.avgPrice]) || 0,
    currency: row[PORTFOLIO_HOLDING_COLS.currency] ?? "IDR",
    sector: row[PORTFOLIO_HOLDING_COLS.sector] ?? "",
    purchaseDate: row[PORTFOLIO_HOLDING_COLS.purchaseDate] ?? "",
    notes: row[PORTFOLIO_HOLDING_COLS.notes] ?? "",
    createdAt: row[PORTFOLIO_HOLDING_COLS.createdAt] ?? "",
    updatedAt: row[PORTFOLIO_HOLDING_COLS.updatedAt] ?? "",
    deleted: row[PORTFOLIO_HOLDING_COLS.deleted] ?? "",
    currentPrice: Number(row[PORTFOLIO_HOLDING_COLS.currentPrice]) || 0,
    previousClose: Number(row[PORTFOLIO_HOLDING_COLS.previousClose]) || 0,
    changePercent:
      (Number(row[PORTFOLIO_HOLDING_COLS.changePercent]) || 0) * 100,
    assetType:
      (row[
        PORTFOLIO_HOLDING_COLS.assetType
      ] as PortfolioHolding["assetType"]) || "stock",
  };
}

//  Portfolio Transactions

export async function readPortfolioTransactions(
  spreadsheetId: string,
  serviceAccountKey?: string,
): Promise<PortfolioTransaction[]> {
  const sheets = getSheetsClient(serviceAccountKey);
  const res = await withBackoff(() =>
    sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "portfolio_transactions!A2:M",
    }),
  );
  return (res.data.values ?? [])
    .map((row, idx) => rowToPortfolioTransaction(row, idx + 2))
    .filter((t) => t.deleted !== "TRUE");
}

export async function appendPortfolioTransaction(
  spreadsheetId: string,
  row: string[],
  serviceAccountKey?: string,
): Promise<void> {
  const sheets = getSheetsClient(serviceAccountKey);
  await withBackoff(() =>
    sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "portfolio_transactions!A:M",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    }),
  );
}

export async function updatePortfolioTransactionRow(
  spreadsheetId: string,
  rowIndex: number,
  row: string[],
  serviceAccountKey?: string,
): Promise<void> {
  const sheets = getSheetsClient(serviceAccountKey);
  await withBackoff(() =>
    sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `portfolio_transactions!A${rowIndex}:M${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: { values: [row] },
    }),
  );
}

export async function deletePortfolioTransactionRow(
  spreadsheetId: string,
  rowIndex: number,
  serviceAccountKey?: string,
): Promise<void> {
  const sheets = getSheetsClient(serviceAccountKey);
  const now = new Date().toISOString();
  await withBackoff(() =>
    sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `portfolio_transactions!L${rowIndex}:M${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: { values: [[now, "TRUE"]] },
    }),
  );
}

function rowToPortfolioTransaction(
  row: string[],
  rowIndex: number,
): PortfolioTransaction {
  return {
    rowIndex,
    id: row[PORTFOLIO_TX_COLS.id] ?? "",
    ticker: row[PORTFOLIO_TX_COLS.ticker] ?? "",
    date: row[PORTFOLIO_TX_COLS.date] ?? "",
    type:
      (row[PORTFOLIO_TX_COLS.type] as PortfolioTransaction["type"]) ?? "buy",
    lots: Number.parseFloat(row[PORTFOLIO_TX_COLS.lots]) || 0,
    shares: Number.parseFloat(row[PORTFOLIO_TX_COLS.shares]) || 0,
    price: Number.parseFloat(row[PORTFOLIO_TX_COLS.price]) || 0,
    fee: Number.parseFloat(row[PORTFOLIO_TX_COLS.fee]) || 0,
    currency: row[PORTFOLIO_TX_COLS.currency] ?? "IDR",
    notes: row[PORTFOLIO_TX_COLS.notes] ?? "",
    createdAt: row[PORTFOLIO_TX_COLS.createdAt] ?? "",
    updatedAt: row[PORTFOLIO_TX_COLS.updatedAt] ?? "",
    deleted: row[PORTFOLIO_TX_COLS.deleted] ?? "",
  };
}
