"use client";

import {
  Alert,
  Button,
  Grid,
  Group,
  NumberFormatter,
  Paper,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconPlus,
  IconTrendingDown,
  IconTrendingUp,
} from "@tabler/icons-react";
import { useState } from "react";
import { AddTransactionModal } from "@/feature/finance/components/add-transaction-modal";
import { CategoryChart } from "@/feature/finance/components/category-chart";
import { MonthlyChart } from "@/feature/finance/components/monthly-chart";
import { useSummary } from "@/feature/finance/hooks/use-summary";

export default function DashboardPage() {
  const { data: summary, isLoading, error } = useSummary("monthly");
  const [addOpen, setAddOpen] = useState(false);

  if (error) {
    const msg = (error as Error).message;
    const needsProvision = msg?.includes("provision");
    return (
      <Alert icon={<IconAlertCircle />} color="orange" title="Setup required">
        {needsProvision
          ? "Your Google Sheet hasn't been provisioned yet. Go to Settings to set up."
          : msg}
      </Alert>
    );
  }

  const last6Months = summary?.monthly.slice(-6) ?? [];

  return (
    <>
      <AddTransactionModal opened={addOpen} onClose={() => setAddOpen(false)} />

      <Group justify="space-between" mb="lg">
        <Title order={2}>Dashboard</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setAddOpen(true)}
        >
          Add Transaction
        </Button>
      </Group>

      {/* Summary cards */}
      <Grid mb="lg">
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Paper withBorder p="md" radius="md">
            <Skeleton visible={isLoading}>
              <Group>
                <IconTrendingUp
                  size={24}
                  color="var(--mantine-color-green-6)"
                />
                <div>
                  <Text size="xs" c="dimmed">
                    Total Income
                  </Text>
                  <Text fw={700} size="xl" c="green">
                    <NumberFormatter
                      value={summary?.totalIncome ?? 0}
                      thousandSeparator
                      decimalScale={2}
                      prefix="$"
                    />
                  </Text>
                </div>
              </Group>
            </Skeleton>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Paper withBorder p="md" radius="md">
            <Skeleton visible={isLoading}>
              <Group>
                <IconTrendingDown
                  size={24}
                  color="var(--mantine-color-red-6)"
                />
                <div>
                  <Text size="xs" c="dimmed">
                    Total Expense
                  </Text>
                  <Text fw={700} size="xl" c="red">
                    <NumberFormatter
                      value={summary?.totalExpense ?? 0}
                      thousandSeparator
                      decimalScale={2}
                      prefix="$"
                    />
                  </Text>
                </div>
              </Group>
            </Skeleton>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Paper withBorder p="md" radius="md">
            <Skeleton visible={isLoading}>
              <div>
                <Text size="xs" c="dimmed">
                  Net Balance
                </Text>
                <Text
                  fw={700}
                  size="xl"
                  c={(summary?.netBalance ?? 0) >= 0 ? "green" : "red"}
                >
                  <NumberFormatter
                    value={summary?.netBalance ?? 0}
                    thousandSeparator
                    decimalScale={2}
                    prefix="$"
                  />
                </Text>
              </div>
            </Skeleton>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Charts */}
      <Grid>
        <Grid.Col span={{ base: 12, lg: 7 }}>
          <Paper withBorder p="md" radius="md">
            <Text fw={600} mb="sm">
              Monthly Overview (last 6 months)
            </Text>
            {isLoading ? (
              <Skeleton height={300} />
            ) : last6Months.length > 0 ? (
              <MonthlyChart data={last6Months} height={300} />
            ) : (
              <Text c="dimmed" ta="center" py="xl">
                No data yet — add some transactions!
              </Text>
            )}
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 5 }}>
          <Paper withBorder p="md" radius="md">
            <Text fw={600} mb="sm">
              Expense by Category
            </Text>
            {isLoading ? (
              <Skeleton height={300} />
            ) : (summary?.byCategory.length ?? 0) > 0 ? (
              <CategoryChart data={summary?.byCategory ?? []} height={300} />
            ) : (
              <Text c="dimmed" ta="center" py="xl">
                No expense categories yet
              </Text>
            )}
          </Paper>
        </Grid.Col>
      </Grid>
    </>
  );
}
