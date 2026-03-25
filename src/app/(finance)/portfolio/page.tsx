"use client";

import {
  Alert,
  Badge,
  Button,
  Group,
  NumberFormatter,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconArrowDown,
  IconArrowUp,
  IconChartDonut,
  IconList,
  IconPlus,
  IconRefresh,
  IconTrendingUp,
  IconWallet,
} from "@tabler/icons-react";
import { useState } from "react";
import { AddHoldingModal } from "@/feature/finance/components/add-holding-modal";
import { AddPortfolioTransactionModal } from "@/feature/finance/components/add-portfolio-transaction-modal";
import { PortfolioAllocationChart } from "@/feature/finance/components/portfolio-allocation-chart";
import { PortfolioHoldingsTable } from "@/feature/finance/components/portfolio-holdings-table";
import { PortfolioTransactionTable } from "@/feature/finance/components/portfolio-transaction-table";
import {
  useDeleteHolding,
  useDeletePortfolioTransaction,
  usePortfolioHoldings,
  usePortfolioSummary,
  usePortfolioTransactions,
} from "@/feature/finance/hooks/use-portfolio";
import type {
  PortfolioHolding,
  PortfolioHoldingWithPrice,
  PortfolioTransaction,
} from "@/feature/finance/types";
import { useQueryClient } from "@tanstack/react-query";

function StatCard({
  label,
  value,
  currency,
  color,
  icon: Icon,
  sub,
}: {
  label: string;
  value: number;
  currency: string;
  color?: string;
  sub?: string;
  icon: React.ComponentType<{ size?: number }>;
}) {
  return (
    <Paper withBorder p="md" radius="md">
      <Group justify="space-between" mb={4}>
        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
          {label}
        </Text>
        <Icon size={18} />
      </Group>
      <Text size="xl" fw={700} c={color}>
        <NumberFormatter
          prefix={`${currency} `}
          value={Math.abs(value)}
          thousandSeparator=","
          decimalScale={0}
        />
      </Text>
      {sub && (
        <Text size="xs" c="dimmed" mt={2}>
          {sub}
        </Text>
      )}
    </Paper>
  );
}

export default function PortfolioPage() {
  const [addHoldingOpen, setAddHoldingOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState<PortfolioHolding | null>(
    null,
  );
  const [addTxOpen, setAddTxOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<PortfolioTransaction | null>(null);

  const qc = useQueryClient();
  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = usePortfolioSummary();
  const { data: holdingsData } = usePortfolioHoldings();
  const { data: txData, isLoading: txLoading } = usePortfolioTransactions();
  const deleteHolding = useDeleteHolding();
  const deleteTx = useDeletePortfolioTransaction();

  const holdings = summary?.holdings ?? [];
  const rawHoldings = holdingsData?.holdings ?? [];
  const transactions = txData?.transactions ?? [];

  const defaultCurrency =
    rawHoldings.find((h) => h.exchange === "IDX")?.currency ?? "IDR";

  function handleEditHolding(h: PortfolioHoldingWithPrice) {
    setEditingHolding(h as PortfolioHolding);
    setAddHoldingOpen(true);
  }

  function handleDeleteHolding(h: PortfolioHoldingWithPrice) {
    modals.openConfirmModal({
      title: "Remove Holding",
      children: `Remove ${h.ticker} from your portfolio?`,
      labels: { confirm: "Remove", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await deleteHolding.mutateAsync(h.rowIndex);
          notifications.show({
            color: "green",
            message: `${h.ticker} removed`,
          });
        } catch (err) {
          notifications.show({ color: "red", message: (err as Error).message });
        }
      },
    });
  }

  function handleEditTx(t: PortfolioTransaction) {
    setEditingTx(t);
    setAddTxOpen(true);
  }

  function handleDeleteTx(t: PortfolioTransaction) {
    modals.openConfirmModal({
      title: "Delete Transaction",
      children: `Delete this ${t.type} transaction for ${t.ticker}?`,
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await deleteTx.mutateAsync(t.rowIndex);
          notifications.show({
            color: "green",
            message: "Transaction deleted",
          });
        } catch (err) {
          notifications.show({ color: "red", message: (err as Error).message });
        }
      },
    });
  }

  function handleRefresh() {
    qc.invalidateQueries({ queryKey: ["finance", "portfolio"] });
  }

  if (summaryError) {
    return (
      <Alert icon={<IconAlertCircle />} color="orange" title="Error">
        {(summaryError as Error).message}
      </Alert>
    );
  }

  const isGain = (summary?.totalUnrealizedPnl ?? 0) >= 0;

  return (
    <>
      <AddHoldingModal
        opened={addHoldingOpen}
        onClose={() => {
          setAddHoldingOpen(false);
          setEditingHolding(null);
        }}
        editing={editingHolding}
      />
      <AddPortfolioTransactionModal
        opened={addTxOpen}
        onClose={() => {
          setAddTxOpen(false);
          setEditingTx(null);
        }}
        editing={editingTx}
        holdings={rawHoldings}
      />

      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Group gap="sm" align="center">
            <Title order={2}>Portfolio Tracker</Title>
            <Badge variant="light" color="blue" size="sm">
              Saham
            </Badge>
          </Group>
          <Group gap="sm">
            <Button
              variant="default"
              size="sm"
              leftSection={<IconRefresh size={16} />}
              onClick={handleRefresh}
              aria-label="Refresh portfolio data"
            >
              Refresh
            </Button>
            <Button
              variant="default"
              size="sm"
              leftSection={<IconList size={16} />}
              onClick={() => setAddTxOpen(true)}
            >
              Log Transaction
            </Button>
            <Button
              size="sm"
              leftSection={<IconPlus size={16} />}
              onClick={() => setAddHoldingOpen(true)}
            >
              Add Holding
            </Button>
          </Group>
        </Group>

        {/* Summary Cards */}
        {summaryLoading ? (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
            {(["value", "invested", "pnl", "dividend"] as const).map((k) => (
              <Skeleton key={k} height={90} radius="md" />
            ))}
          </SimpleGrid>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
            <StatCard
              label="Portfolio Value"
              value={summary?.totalCurrentValue ?? 0}
              currency={defaultCurrency}
              icon={IconWallet}
            />
            <StatCard
              label="Total Invested"
              value={summary?.totalCostBasis ?? 0}
              currency={defaultCurrency}
              icon={IconChartDonut}
            />
            <StatCard
              label="Unrealized P&L"
              value={summary?.totalUnrealizedPnl ?? 0}
              currency={defaultCurrency}
              color={isGain ? "green" : "red"}
              icon={isGain ? IconArrowUp : IconArrowDown}
              sub={
                summary?.totalUnrealizedPnlPct !== undefined
                  ? `${summary.totalUnrealizedPnlPct >= 0 ? "+" : ""}${summary.totalUnrealizedPnlPct.toFixed(2)}%`
                  : undefined
              }
            />
            <StatCard
              label="Total Dividends"
              value={summary?.totalDividends ?? 0}
              currency={defaultCurrency}
              icon={IconTrendingUp}
            />
          </SimpleGrid>
        )}

        {/* Tabs: Holdings / Transactions / Allocation */}
        <Tabs defaultValue="holdings" keepMounted={false}>
          <Tabs.List>
            <Tabs.Tab value="holdings" leftSection={<IconWallet size={16} />}>
              Holdings
            </Tabs.Tab>
            <Tabs.Tab value="transactions" leftSection={<IconList size={16} />}>
              Transactions
            </Tabs.Tab>
            <Tabs.Tab
              value="allocation"
              leftSection={<IconChartDonut size={16} />}
            >
              Allocation
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="holdings" pt="md">
            {summaryLoading ? (
              <Skeleton height={200} />
            ) : (
              <Paper withBorder>
                <PortfolioHoldingsTable
                  holdings={holdings}
                  onEdit={handleEditHolding}
                  onDelete={handleDeleteHolding}
                  onRefresh={handleRefresh}
                />
              </Paper>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="transactions" pt="md">
            {txLoading ? (
              <Skeleton height={200} />
            ) : (
              <Paper withBorder>
                <PortfolioTransactionTable
                  transactions={transactions}
                  onEdit={handleEditTx}
                  onDelete={handleDeleteTx}
                />
              </Paper>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="allocation" pt="md">
            {summaryLoading ? (
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                <Skeleton height={280} />
                <Skeleton height={280} />
              </SimpleGrid>
            ) : (
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                <PortfolioAllocationChart
                  title="By Sector"
                  data={(summary?.bySector ?? []).map((s) => ({
                    name: s.sector,
                    value: s.value,
                    pct: s.pct,
                  }))}
                  currency={defaultCurrency}
                />
                <PortfolioAllocationChart
                  title="By Exchange"
                  data={(summary?.byExchange ?? []).map((e) => ({
                    name: e.exchange,
                    value: e.value,
                    pct: e.pct,
                  }))}
                  currency={defaultCurrency}
                />
              </SimpleGrid>
            )}
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </>
  );
}
