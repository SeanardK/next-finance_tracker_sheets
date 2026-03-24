import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Account } from "../types";

async function fetchAccounts(): Promise<{ accounts: Account[] }> {
  const res = await fetch("/api/finance/accounts");
  if (!res.ok)
    throw new Error((await res.json()).error ?? "Failed to fetch accounts");
  return res.json();
}

async function createAccount(
  data: Omit<Account, "rowIndex" | "id" | "createdAt">,
): Promise<void> {
  const res = await fetch("/api/finance/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok)
    throw new Error((await res.json()).error ?? "Failed to create account");
}

async function updateAccount(rowId: number, data: Account): Promise<void> {
  const res = await fetch(`/api/finance/accounts/${rowId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok)
    throw new Error((await res.json()).error ?? "Failed to update account");
}

async function deleteAccount(rowId: number): Promise<void> {
  const res = await fetch(`/api/finance/accounts/${rowId}`, {
    method: "DELETE",
  });
  if (!res.ok)
    throw new Error((await res.json()).error ?? "Failed to delete account");
}

export function useAccounts() {
  return useQuery({
    queryKey: ["finance", "accounts"],
    queryFn: fetchAccounts,
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAccount,
    onSettled: () =>
      qc.invalidateQueries({ queryKey: ["finance", "accounts"] }),
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rowId, data }: { rowId: number; data: Account }) =>
      updateAccount(rowId, data),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: ["finance", "accounts"] }),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAccount,
    onSettled: () =>
      qc.invalidateQueries({ queryKey: ["finance", "accounts"] }),
  });
}
