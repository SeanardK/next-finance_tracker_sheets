import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Category } from "../types";

async function fetchCategories(): Promise<{ categories: Category[] }> {
  const res = await fetch("/api/finance/categories");
  if (!res.ok)
    throw new Error((await res.json()).error ?? "Failed to fetch categories");
  return res.json();
}

async function createCategory(
  data: Omit<Category, "id" | "createdAt">,
): Promise<void> {
  const res = await fetch("/api/finance/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok)
    throw new Error((await res.json()).error ?? "Failed to create category");
}

async function updateCategory(rowId: number, data: Category): Promise<void> {
  const res = await fetch(`/api/finance/categories/${rowId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok)
    throw new Error((await res.json()).error ?? "Failed to update category");
}

async function deleteCategory(rowId: number): Promise<void> {
  const res = await fetch(`/api/finance/categories/${rowId}`, {
    method: "DELETE",
  });
  if (!res.ok)
    throw new Error((await res.json()).error ?? "Failed to delete category");
}

export function useCategories() {
  return useQuery({
    queryKey: ["finance", "categories"],
    queryFn: fetchCategories,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSettled: () =>
      qc.invalidateQueries({ queryKey: ["finance", "categories"] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rowId, data }: { rowId: number; data: Category }) =>
      updateCategory(rowId, data),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: ["finance", "categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCategory,
    onSettled: () =>
      qc.invalidateQueries({ queryKey: ["finance", "categories"] }),
  });
}
