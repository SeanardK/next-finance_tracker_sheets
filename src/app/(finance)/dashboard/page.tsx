"use client";

import {
  Alert,
  Badge,
  Button,
  Grid,
  Group,
  NumberFormatter,
  Paper,
  Progress,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconArrowRight,
  IconCreditCard,
  IconPlus,
  IconTrendingDown,
  IconTrendingUp,
  IconWallet,
} from "@tabler/icons-react";
import { MonthPickerInput } from "@mantine/dates";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AddTransactionModal } from "@/feature/finance/components/add-transaction-modal";
import { CategoryChart } from "@/feature/finance/components/category-chart";
import { MonthlyChart } from "@/feature/finance/components/monthly-chart";
import { useAccountBalances } from "@/feature/finance/hooks/use-accounts";
import { useBudgets } from "@/feature/finance/hooks/use-budgets";
import { useSummary } from "@/feature/finance/hooks/use-summary";
import { useTransactions } from "@/feature/finance/hooks/use-transactions";

function toMonthStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fmt(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function DashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => new Date());
  const month = toMonthStr(selectedMonth);
  const [addOpen, setAddOpen] = useState(false);

  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = useSummary("monthly");
  const { data: balanceData, isLoading: balanceLoading } =
    useAccountBalances(month);
  const { data: budgetData, isLoading: budgetLoading } = useBudgets(month);
  const { data: txData, isLoading: txLoading } = useTransactions(200);

  const thisMonthStats = summary?.monthly.find((m) => m.month === month);
  const last6Months = useMemo(() => {
    const monthly = summary?.monthly ?? [];
    const idx = monthly.findIndex((m) => m.month === month);
    if (idx === -1) return monthly.slice(-6);
    return monthly.slice(Math.max(0, idx - 5), idx + 1);
  }, [summary, month]);
  const balances = balanceData?.balances ?? [];
  const expenseBudgets = (budgetData?.budgets ?? []).filter(
    (b) => b.type === "expense",
  );
  const recentTx = useMemo(
    () =>
      (txData?.transactions ?? [])
        .filter((tx) => tx.date.slice(0, 7) === month && tx.deleted !== "TRUE")
        .slice(0, 10),
    [txData, month],
  );

  if (summaryError) {
    const msg = (summaryError as Error).message;
    const needsProvision = msg?.includes("provision");
    return (
      <Alert icon={<IconAlertCircle />} color="orange" title="Setup required">
        {needsProvision
          ? "Your Google Sheet hasn't been provisioned yet. Go to Settings to set up."
          : msg}
      </Alert>
    );
  }

  return (
    <>
      <AddTransactionModal opened={addOpen} onClose={() => setAddOpen(false)} />

      <Group justify="space-between" mb="lg" wrap="wrap" gap="sm">
        <Group gap="sm" wrap="nowrap">
          <Title order={2}>Dashboard</Title>
          <MonthPickerInput
            value={selectedMonth}
            onChange={(v) => v && setSelectedMonth(v)}
            valueFormat="MMM YYYY"
            maxDate={new Date()}
            w={150}
            size="sm"
            aria-label="Select month"
          />
        </Group>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setAddOpen(true)}
        >
          Add Transaction
        </Button>
      </Group>

      {/* ── This Month Stats ── */}
      <SimpleGrid cols={{ base: 2, md: 4 }} mb="lg">
        <Paper withBorder p="md" radius="md">
          <Skeleton visible={summaryLoading}>
            <Group gap="sm" wrap="nowrap">
              <IconTrendingUp
                size={22}
                color="var(--mantine-color-green-6)"
                style={{ flexShrink: 0 }}
              />
              <div>
                <Text size="xs" c="dimmed">
                  Income
                </Text>
                <Text fw={700} c="green" size="lg">
                  {fmt(thisMonthStats?.income ?? 0)}
                </Text>
              </div>
            </Group>
          </Skeleton>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Skeleton visible={summaryLoading}>
            <Group gap="sm" wrap="nowrap">
              <IconTrendingDown
                size={22}
                color="var(--mantine-color-red-6)"
                style={{ flexShrink: 0 }}
              />
              <div>
                <Text size="xs" c="dimmed">
                  Expense
                </Text>
                <Text fw={700} c="red" size="lg">
                  {fmt(thisMonthStats?.expense ?? 0)}
                </Text>
              </div>
            </Group>
          </Skeleton>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Skeleton visible={summaryLoading}>
            <div>
              <Text size="xs" c="dimmed">
                Net
              </Text>
              <Text
                fw={700}
                size="lg"
                c={(thisMonthStats?.net ?? 0) >= 0 ? "green" : "red"}
              >
                {(thisMonthStats?.net ?? 0) >= 0 ? "+" : ""}
                {fmt(thisMonthStats?.net ?? 0)}
              </Text>
            </div>
          </Skeleton>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Skeleton visible={summaryLoading}>
            <div>
              <Text size="xs" c="dimmed">
                All-time Net Balance
              </Text>
              <Text
                fw={700}
                size="lg"
                c={(summary?.netBalance ?? 0) >= 0 ? "teal" : "red"}
              >
                {(summary?.netBalance ?? 0) >= 0 ? "+" : ""}
                <NumberFormatter
                  value={summary?.netBalance ?? 0}
                  thousandSeparator
                  decimalScale={0}
                />
              </Text>
            </div>
          </Skeleton>
        </Paper>
      </SimpleGrid>

      {/* ── Account Balances ── */}
      {(balanceLoading || balances.length > 0) && (
        <Paper withBorder p="md" radius="md" mb="lg">
          <Group justify="space-between" mb="sm">
            <Group gap="xs">
              <IconCreditCard size={18} />
              <Text fw={600}>Account Balances</Text>
            </Group>
            <Text
              component={Link}
              href="/accounts"
              size="xs"
              c="blue"
              style={{ display: "flex", alignItems: "center", gap: 4 }}
            >
              Manage <IconArrowRight size={12} />
            </Text>
          </Group>
          {balanceLoading ? (
            <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }}>
              {[1, 2, 3].map((k) => (
                <Skeleton key={k} height={80} radius="md" />
              ))}
            </SimpleGrid>
          ) : (
            <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }}>
              {balances.map((b) => (
                <Paper
                  key={b.account}
                  withBorder
                  p="sm"
                  radius="md"
                  bg="var(--mantine-color-default-hover)"
                >
                  <Group gap={6} mb={4} wrap="nowrap">
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: b.color || "#868e96",
                        flexShrink: 0,
                      }}
                    />
                    <Text size="xs" fw={600} truncate>
                      {b.account}
                    </Text>
                  </Group>
                  <Text
                    size="sm"
                    fw={700}
                    c={b.netBalance >= 0 ? "teal" : "red"}
                  >
                    {b.netBalance >= 0 ? "+" : ""}
                    {fmt(b.netBalance)} {b.currency}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Spent: {fmt(b.monthSpent)} {b.currency}
                  </Text>
                </Paper>
              ))}
            </SimpleGrid>
          )}
        </Paper>
      )}

      {/* ── Budget Progress + Category Chart ── */}
      <Grid mb="lg">
        <Grid.Col span={{ base: 12, lg: 7 }}>
          <Paper withBorder p="md" radius="md" h="100%">
            <Group justify="space-between" mb="sm">
              <Group gap="xs">
                <IconWallet size={18} />
                <Text fw={600}>Budget Progress</Text>
              </Group>
              <Text
                component={Link}
                href="/budgeting"
                size="xs"
                c="blue"
                style={{ display: "flex", alignItems: "center", gap: 4 }}
              >
                All budgets <IconArrowRight size={12} />
              </Text>
            </Group>
            {budgetLoading ? (
              <Skeleton height={200} />
            ) : expenseBudgets.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl" size="sm">
                No expense budgets set for this month —{" "}
                <Text
                  component={Link}
                  href="/budgeting"
                  c="blue"
                  size="sm"
                  span
                >
                  add one
                </Text>
              </Text>
            ) : (
              <Stack gap="xs">
                {expenseBudgets.slice(0, 6).map((b) => {
                  const pct =
                    b.amount > 0
                      ? Math.min(100, (b.actual / b.amount) * 100)
                      : 0;
                  const color =
                    pct >= 100 ? "red" : pct >= 80 ? "orange" : "teal";
                  return (
                    <div key={b.id}>
                      <Group justify="space-between" mb={2}>
                        <Text size="xs" fw={500}>
                          {b.category}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {fmt(b.actual)} / {fmt(b.amount)} {b.currency}
                        </Text>
                      </Group>
                      <Progress
                        value={pct}
                        color={color}
                        size="sm"
                        radius="xl"
                      />
                    </div>
                  );
                })}
              </Stack>
            )}
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 5 }}>
          <Paper withBorder p="md" radius="md" h="100%">
            <Text fw={600} mb="sm">
              Expense by Category
            </Text>
            {summaryLoading ? (
              <Skeleton height={220} />
            ) : (summary?.byCategory.length ?? 0) > 0 ? (
              <CategoryChart data={summary?.byCategory ?? []} height={220} />
            ) : (
              <Text c="dimmed" ta="center" py="xl">
                No expense categories yet
              </Text>
            )}
          </Paper>
        </Grid.Col>
      </Grid>

      {/* ── Monthly Overview Chart ── */}
      <Paper withBorder p="md" radius="md" mb="lg">
        <Text fw={600} mb="sm">
          Monthly Overview (last 6 months)
        </Text>
        {summaryLoading ? (
          <Skeleton height={260} />
        ) : last6Months.length > 0 ? (
          <MonthlyChart data={last6Months} height={260} />
        ) : (
          <Text c="dimmed" ta="center" py="xl">
            No data yet — add some transactions!
          </Text>
        )}
      </Paper>

      {/* ── Recent Transactions ── */}
      <Paper withBorder p="md" radius="md">
        <Group justify="space-between" mb="sm">
          <Text fw={600}>Recent Transactions</Text>
          <Text
            component={Link}
            href="/transactions"
            size="xs"
            c="blue"
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            View all <IconArrowRight size={12} />
          </Text>
        </Group>
        {txLoading ? (
          <Skeleton height={160} />
        ) : recentTx.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl" size="sm">
            No transactions yet
          </Text>
        ) : (
          <Table.ScrollContainer minWidth={400}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Account</Table.Th>
                  <Table.Th>Category</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th style={{ textAlign: "right" }}>Amount</Table.Th>
                  <Table.Th>Type</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {recentTx.map((tx) => (
                  <Table.Tr key={tx.rowIndex}>
                    <Table.Td>
                      <Text size="xs">{tx.date}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs">{tx.account || "—"}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs">{tx.category || "—"}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed" truncate maw={200}>
                        {tx.description || "—"}
                      </Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: "right" }}>
                      <Text
                        size="xs"
                        fw={600}
                        c={
                          tx.type === "income"
                            ? "green"
                            : tx.type === "expense"
                              ? "red"
                              : "blue"
                        }
                      >
                        {tx.type === "income"
                          ? "+"
                          : tx.type === "expense"
                            ? "-"
                            : ""}
                        {fmt(tx.amount)} {tx.currency}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        size="xs"
                        color={
                          tx.type === "income"
                            ? "green"
                            : tx.type === "expense"
                              ? "red"
                              : "blue"
                        }
                        variant="light"
                      >
                        {tx.type}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Paper>
    </>
  );
}
