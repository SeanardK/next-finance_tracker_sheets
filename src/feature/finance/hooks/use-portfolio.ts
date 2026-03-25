import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  PortfolioHolding,
  PortfolioSummary,
  PortfolioTransaction,
} from "../types";
import type { MarketQuote } from "@/app/api/finance/portfolio/market-price/route";

// ─── Holdings ────────────────────────────────────────────────────────────────

type HoldingFormValues = Omit<
  PortfolioHolding,
  "rowIndex" | "id" | "createdAt" | "updatedAt" | "deleted"
>;

async function fetchHoldings(): Promise<{ holdings: PortfolioHolding[] }> {
  const res = await fetch("/api/finance/portfolio/holdings");
  if (!res.ok)
    throw new Error((await res.json()).error ?? "Failed to fetch holdings");
  return res.json();
}

async function createHolding(data: HoldingFormValues): Promise<void> {
  const res = await fetch("/api/finance/portfolio/holdings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok)
    throw new Error((await res.json()).error ?? "Failed to create holding");
}

async function updateHolding(
  rowId: number,
  data: Partial<HoldingFormValues>,
): Promise<void> {
  const res = await fetch(`/api/finance/portfolio/holdings/${rowId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok)
    throw new Error((await res.json()).error ?? "Failed to update holding");
}

async function deleteHolding(rowId: number): Promise<void> {
  const res = await fetch(`/api/finance/portfolio/holdings/${rowId}`, {
    method: "DELETE",
  });
  if (!res.ok)
    throw new Error((await res.json()).error ?? "Failed to delete holding");
}

export function usePortfolioHoldings() {
  return useQuery({
    queryKey: ["finance", "portfolio", "holdings"],
    queryFn: fetchHoldings,
  });
}

export function useCreateHolding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createHolding,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["finance", "portfolio"] });
    },
  });
}

export function useUpdateHolding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      rowId,
      data,
    }: {
      rowId: number;
      data: Partial<HoldingFormValues>;
    }) => updateHolding(rowId, data),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["finance", "portfolio"] });
    },
  });
}

export function useDeleteHolding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteHolding,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["finance", "portfolio"] });
    },
  });
}

// ─── Portfolio Transactions ───────────────────────────────────────────────────

type PortfolioTxFormValues = Omit<
  PortfolioTransaction,
  "rowIndex" | "id" | "createdAt" | "updatedAt" | "deleted"
>;

async function fetchPortfolioTransactions(
  ticker?: string,
): Promise<{ transactions: PortfolioTransaction[] }> {
  const url = ticker
    ? `/api/finance/portfolio/transactions?ticker=${encodeURIComponent(ticker)}`
    : "/api/finance/portfolio/transactions";
  const res = await fetch(url);
  if (!res.ok)
    throw new Error(
      (await res.json()).error ?? "Failed to fetch portfolio transactions",
    );
  return res.json();
}

async function createPortfolioTransaction(
  data: PortfolioTxFormValues,
): Promise<void> {
  const res = await fetch("/api/finance/portfolio/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok)
    throw new Error(
      (await res.json()).error ?? "Failed to create portfolio transaction",
    );
}

async function updatePortfolioTransaction(
  rowId: number,
  data: Partial<PortfolioTxFormValues>,
): Promise<void> {
  const res = await fetch(`/api/finance/portfolio/transactions/${rowId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok)
    throw new Error(
      (await res.json()).error ?? "Failed to update portfolio transaction",
    );
}

async function deletePortfolioTransaction(rowId: number): Promise<void> {
  const res = await fetch(`/api/finance/portfolio/transactions/${rowId}`, {
    method: "DELETE",
  });
  if (!res.ok)
    throw new Error(
      (await res.json()).error ?? "Failed to delete portfolio transaction",
    );
}

export function usePortfolioTransactions(ticker?: string) {
  return useQuery({
    queryKey: ["finance", "portfolio", "transactions", ticker ?? "all"],
    queryFn: () => fetchPortfolioTransactions(ticker),
  });
}

export function useCreatePortfolioTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPortfolioTransaction,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["finance", "portfolio"] });
    },
  });
}

export function useUpdatePortfolioTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      rowId,
      data,
    }: {
      rowId: number;
      data: Partial<PortfolioTxFormValues>;
    }) => updatePortfolioTransaction(rowId, data),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["finance", "portfolio"] });
    },
  });
}

export function useDeletePortfolioTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePortfolioTransaction,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["finance", "portfolio"] });
    },
  });
}

// ─── Market Prices ───────────────────────────────────────────────────────────

async function fetchMarketPrices(
  tickers: string[],
): Promise<{ quotes: MarketQuote[] }> {
  if (tickers.length === 0) return { quotes: [] };
  const res = await fetch(
    `/api/finance/portfolio/market-price?tickers=${encodeURIComponent(tickers.join(","))}`,
  );
  if (!res.ok)
    throw new Error((await res.json()).error ?? "Failed to fetch prices");
  return res.json();
}

export function useMarketPrices(tickers: string[]) {
  return useQuery({
    queryKey: [
      "finance",
      "portfolio",
      "market-price",
      tickers.sort().join(","),
    ],
    queryFn: () => fetchMarketPrices(tickers),
    enabled: tickers.length > 0,
    staleTime: 5 * 60 * 1000, // 5 min
    refetchInterval: 5 * 60 * 1000,
  });
}

// ─── Portfolio Summary ────────────────────────────────────────────────────────

async function fetchPortfolioSummary(): Promise<PortfolioSummary> {
  const res = await fetch("/api/finance/portfolio/summary");
  if (!res.ok)
    throw new Error(
      (await res.json()).error ?? "Failed to fetch portfolio summary",
    );
  return res.json();
}

export function usePortfolioSummary() {
  return useQuery({
    queryKey: ["finance", "portfolio", "summary"],
    queryFn: fetchPortfolioSummary,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}
