import { useQuery } from "@tanstack/react-query";
import type { Summary } from "../types";

async function fetchSummary(range: "monthly" | "yearly"): Promise<Summary> {
  const res = await fetch(`/api/finance/summary?range=${range}`);
  if (!res.ok)
    throw new Error((await res.json()).error ?? "Failed to fetch summary");
  return res.json();
}

export function useSummary(range: "monthly" | "yearly" = "monthly") {
  return useQuery({
    queryKey: ["finance", "summary", range],
    queryFn: () => fetchSummary(range),
  });
}
