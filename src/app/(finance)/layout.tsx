import type { Metadata } from "next";
import { FinanceShell } from "./_shell";

export const metadata: Metadata = {
  title: "Finance Tracker",
  description: "Track your personal finances across multiple accounts.",
};

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FinanceShell>{children}</FinanceShell>;
}
