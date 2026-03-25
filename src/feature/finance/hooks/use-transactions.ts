import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Transaction, TransactionFormValues } from "../types";

interface TransactionsResponse {
  transactions: Transaction[];
  limit: number;
  offset: number;
}

async function fetchTransactions(
  limit = 200,
  offset = 0,
): Promise<TransactionsResponse> {
  const res = await fetch(
    `/api/finance/transactions?limit=${limit}&offset=${offset}`,
  );
  if (!res.ok)
    throw new Error((await res.json()).error ?? "Failed to fetch transactions");
  return res.json();
}

async function createTransaction(data: TransactionFormValues): Promise<void> {
  const res = await fetch("/api/finance/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok)
    throw new Error((await res.json()).error ?? "Failed to create transaction");
}

async function updateTransaction(
  rowId: number,
  data: TransactionFormValues & { externalId?: string; createdAt?: string },
): Promise<void> {
  const res = await fetch(`/api/finance/transactions/${rowId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok)
    throw new Error((await res.json()).error ?? "Failed to update transaction");
}

async function deleteTransaction(rowId: number): Promise<void> {
  const res = await fetch(`/api/finance/transactions/${rowId}`, {
    method: "DELETE",
  });
  if (!res.ok)
    throw new Error((await res.json()).error ?? "Failed to delete transaction");
}

export function useTransactions(limit = 200, offset = 0) {
  return useQuery({
    queryKey: ["finance", "transactions", limit, offset],
    queryFn: () => fetchTransactions(limit, offset),
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTransaction,
    onMutate: async (newTx) => {
      await qc.cancelQueries({ queryKey: ["finance", "transactions"] });
      const prev = qc.getQueryData<TransactionsResponse>([
        "finance",
        "transactions",
        200,
        0,
      ]);
      if (prev) {
        const optimistic: Transaction = {
          ...newTx,
          rowIndex: -1,
          externalId: "optimistic",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deleted: "FALSE",
        };
        qc.setQueryData<TransactionsResponse>(
          ["finance", "transactions", 200, 0],
          {
            ...prev,
            transactions: [optimistic, ...prev.transactions],
          },
        );
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(["finance", "transactions", 200, 0], ctx.prev);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["finance", "transactions"] });
      qc.invalidateQueries({ queryKey: ["finance", "summary"] });
      qc.invalidateQueries({ queryKey: ["finance", "accounts", "balance"] });
      qc.invalidateQueries({ queryKey: ["finance", "budgets"] });
    },
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      rowId,
      data,
    }: {
      rowId: number;
      data: TransactionFormValues & { externalId?: string; createdAt?: string };
    }) => updateTransaction(rowId, data),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["finance", "transactions"] });
      qc.invalidateQueries({ queryKey: ["finance", "summary"] });
      qc.invalidateQueries({ queryKey: ["finance", "accounts", "balance"] });
      qc.invalidateQueries({ queryKey: ["finance", "budgets"] });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTransaction,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["finance", "transactions"] });
      qc.invalidateQueries({ queryKey: ["finance", "summary"] });
      qc.invalidateQueries({ queryKey: ["finance", "accounts", "balance"] });
      qc.invalidateQueries({ queryKey: ["finance", "budgets"] });
    },
  });
}
