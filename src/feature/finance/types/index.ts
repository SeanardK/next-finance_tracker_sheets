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
];

export const META_HEADERS = ["key", "value"];
