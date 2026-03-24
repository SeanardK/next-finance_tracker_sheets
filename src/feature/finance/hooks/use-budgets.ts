import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Budget, BudgetWithActual } from "../types";

interface BudgetsResponse {
  budgets: BudgetWithActual[];
  month: string;
}

async function fetchBudgets(month: string): Promise<BudgetsResponse> {
  const res = await fetch(`/api/finance/budgets?month=${month}`);
  if (!res.ok)
    throw new Error((await res.json()).error ?? "Failed to fetch budgets");
  return res.json();
}

async function createBudget(
  data: Omit<Budget, "rowIndex" | "id" | "createdAt" | "updatedAt">,
): Promise<void> {
  const res = await fetch("/api/finance/budgets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok)
    throw new Error((await res.json()).error ?? "Failed to create budget");
}

async function updateBudget(rowId: number, data: Budget): Promise<void> {
  const res = await fetch(`/api/finance/budgets/${rowId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok)
    throw new Error((await res.json()).error ?? "Failed to update budget");
}

async function deleteBudget(rowId: number): Promise<void> {
  const res = await fetch(`/api/finance/budgets/${rowId}`, {
    method: "DELETE",
  });
  if (!res.ok)
    throw new Error((await res.json()).error ?? "Failed to delete budget");
}

export function useBudgets(month: string) {
  return useQuery({
    queryKey: ["finance", "budgets", month],
    queryFn: () => fetchBudgets(month),
  });
}

export function useCreateBudget(month: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBudget,
    onSettled: () =>
      qc.invalidateQueries({ queryKey: ["finance", "budgets", month] }),
  });
}

export function useUpdateBudget(month: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rowId, data }: { rowId: number; data: Budget }) =>
      updateBudget(rowId, data),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: ["finance", "budgets", month] }),
  });
}

export function useDeleteBudget(month: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteBudget,
    onSettled: () =>
      qc.invalidateQueries({ queryKey: ["finance", "budgets", month] }),
  });
}
