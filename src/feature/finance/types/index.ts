export type TransactionType = "income" | "expense" | "transfer";

export interface Transaction {
  rowIndex: number;
  date: string;
  account: string;
  category: string;
  amount: number;
  currency: string;
  type: TransactionType;
  description: string;
  tags: string;
  externalId: string;
  createdAt: string;
  updatedAt: string;
  deleted: string;
}

export interface Category {
  id: string;
  name: string;
  parentId: string;
  type: TransactionType | "all";
  color: string;
  createdAt: string;
}

export type AccountType =
  | "bank"
  | "cash"
  | "e-wallet"
  | "investment"
  | "credit";

export interface Account {
  rowIndex: number;
  id: string;
  name: string;
  type: AccountType;
  color: string;
  createdAt: string;
}

export interface AccountBalance {
  account: string;
  color: string;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  // month-scoped
  monthBudgeted: number;
  monthSpent: number;
  monthRemaining: number;
  currency: string;
}

export interface SummaryMonth {
  month: string;
  income: number;
  expense: number;
  net: number;
}

export interface CategorySummary {
  category: string;
  total: number;
  type: TransactionType;
}

export interface Summary {
  monthly: SummaryMonth[];
  byCategory: CategorySummary[];
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
}

export interface ProvisionResult {
  spreadsheetId: string;
  alreadyExisted: boolean;
}

export type TransactionFormValues = Omit<
  Transaction,
  "rowIndex" | "externalId" | "createdAt" | "updatedAt" | "deleted"
>;

export const TX_COLS = {
  date: 0,
  account: 1,
  category: 2,
  amount: 3,
  currency: 4,
  type: 5,
  description: 6,
  tags: 7,
  externalId: 8,
  createdAt: 9,
  updatedAt: 10,
  deleted: 11,
} as const;

export const CAT_COLS = {
  id: 0,
  name: 1,
  parentId: 2,
  type: 3,
  color: 4,
  createdAt: 5,
} as const;

export const TX_HEADERS = [
  "Date",
  "Account",
  "Category",
  "Amount",
  "Currency",
  "Type",
  "Description",
  "Tags",
  "ExternalId",
  "CreatedAt",
  "UpdatedAt",
  "Deleted",
];

export const CAT_HEADERS = [
  "id",
  "name",
  "parentId",
  "type",
  "color",
  "createdAt",
];

export const ACCT_COLS = {
  id: 0,
  name: 1,
  type: 2,
  color: 3,
  createdAt: 4,
} as const;

export const ACCT_HEADERS = ["id", "name", "type", "color", "createdAt"];

export interface Budget {
  rowIndex: number;
  id: string;
  month: string; // YYYY-MM
  category: string;
  type: "income" | "expense";
  amount: number;
  currency: string;
  account: string; // empty = applies to all accounts
  createdAt: string;
  updatedAt: string;
}

export interface BudgetWithActual extends Budget {
  actual: number;
  remaining: number;
  percentUsed: number;
}

export const BUDGET_COLS = {
  id: 0,
  month: 1,
  category: 2,
  type: 3,
  amount: 4,
  currency: 5,
  createdAt: 6,
  updatedAt: 7,
  account: 8, // appended at end — empty string = all accounts
} as const;

export const BUDGET_HEADERS = [
  "id",
  "month",
  "category",
  "type",
  "amount",
  "currency",
  "createdAt",
  "updatedAt",
  "account",
];

export const META_HEADERS = ["key", "value"];

// ─── Portfolio ────────────────────────────────────────────────────────────────

export type PortfolioTransactionType = "buy" | "sell" | "dividend" | "split";

export interface PortfolioHolding {
  rowIndex: number;
  id: string;
  ticker: string;
  name: string;
  exchange: string; // e.g. "IDX", "NASDAQ", "NYSE"
  lots: number; // lots held (1 lot = 100 shares on IDX; 1 lot = 1 share otherwise)
  shares: number; // total shares (lots * lotSize OR direct)
  avgPrice: number; // average cost basis per share
  currency: string;
  sector: string;
  purchaseDate: string; // ISO date of first purchase
  notes: string;
  createdAt: string;
  updatedAt: string;
  deleted: string;
  currentPrice: number; // =GOOGLEFINANCE(ticker,"price")
  previousClose: number; // =GOOGLEFINANCE(ticker,"closeyest")
  changePercent: number; // =GOOGLEFINANCE(ticker,"changepct") * 100
}

export interface PortfolioTransaction {
  rowIndex: number;
  id: string;
  ticker: string;
  date: string;
  type: PortfolioTransactionType;
  lots: number;
  shares: number;
  price: number; // price per share
  fee: number;
  currency: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  deleted: string;
}

export interface PortfolioHoldingWithPrice extends PortfolioHolding {
  currentValue: number;
  costBasis: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  priceError?: boolean; // true if market price fetch failed
}

export interface PortfolioSummary {
  totalCostBasis: number;
  totalCurrentValue: number;
  totalUnrealizedPnl: number;
  totalUnrealizedPnlPct: number;
  totalDividends: number;
  holdings: PortfolioHoldingWithPrice[];
  bySector: { sector: string; value: number; pct: number }[];
  byExchange: { exchange: string; value: number; pct: number }[];
}

export const PORTFOLIO_HOLDING_COLS = {
  id: 0,
  ticker: 1,
  name: 2,
  exchange: 3,
  lots: 4,
  shares: 5,
  avgPrice: 6,
  currency: 7,
  sector: 8,
  purchaseDate: 9,
  notes: 10,
  createdAt: 11,
  updatedAt: 12,
  deleted: 13,
  currentPrice: 14,
  previousClose: 15,
  changePercent: 16,
} as const;

export const PORTFOLIO_HOLDING_HEADERS = [
  "id",
  "ticker",
  "name",
  "exchange",
  "lots",
  "shares",
  "avgPrice",
  "currency",
  "sector",
  "purchaseDate",
  "notes",
  "createdAt",
  "updatedAt",
  "deleted",
  "currentPrice",
  "previousClose",
  "changePercent",
];

export const PORTFOLIO_TX_COLS = {
  id: 0,
  ticker: 1,
  date: 2,
  type: 3,
  lots: 4,
  shares: 5,
  price: 6,
  fee: 7,
  currency: 8,
  notes: 9,
  createdAt: 10,
  updatedAt: 11,
  deleted: 12,
} as const;

export const PORTFOLIO_TX_HEADERS = [
  "id",
  "ticker",
  "date",
  "type",
  "lots",
  "shares",
  "price",
  "fee",
  "currency",
  "notes",
  "createdAt",
  "updatedAt",
  "deleted",
];
