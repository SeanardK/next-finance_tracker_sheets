"use client";

import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  Modal,
  NumberInput,
  Paper,
  Progress,
  Select,
  Skeleton,
  Stack,
  Table,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconEdit,
  IconPlus,
  IconTrash,
  IconWallet,
} from "@tabler/icons-react";
import { useState } from "react";
import {
  useCreateBudget,
  useDeleteBudget,
  useBudgets,
  useUpdateBudget,
} from "@/feature/finance/hooks/use-budgets";
import { useAccounts } from "@/feature/finance/hooks/use-accounts";
import { useCategories } from "@/feature/finance/hooks/use-categories";
import type { Budget, BudgetWithActual } from "@/feature/finance/types";

interface BudgetForm {
  category: string;
  type: "income" | "expense";
  amount: number;
  currency: string;
  account: string;
}

function getMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = -11; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
    options.push({ value, label });
  }
  return options;
}

function progressColor(pct: number) {
  if (pct >= 100) return "red";
  if (pct >= 80) return "orange";
  return "teal";
}

function formatAmount(n: number, currency: string) {
  return `${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${currency}`;
}

interface BudgetSectionProps {
  title: string;
  color: string;
  rows: BudgetWithActual[];
  onEdit: (b: BudgetWithActual) => void;
  onDelete: (b: BudgetWithActual) => void;
}

function BudgetSection({
  title,
  color,
  rows,
  onEdit,
  onDelete,
}: BudgetSectionProps) {
  const totalBudgeted = rows.reduce((s, r) => s + r.amount, 0);
  const totalActual = rows.reduce((s, r) => s + r.actual, 0);
  const totalRemaining = totalBudgeted - totalActual;
  const currency = rows[0]?.currency ?? "IDR";

  return (
    <Paper withBorder radius="md" mb="lg">
      <Group px="md" py="sm" style={{ borderBottom: "1px solid #e9ecef" }}>
        <Badge color={color} size="lg" variant="light">
          {title}
        </Badge>
        {rows.length > 0 && (
          <Text size="sm" c="dimmed" ml="auto">
            {formatAmount(totalActual, currency)} /{" "}
            {formatAmount(totalBudgeted, currency)} budgeted
          </Text>
        )}
      </Group>
      <Table.ScrollContainer minWidth={600}>
        <Table highlightOnHover withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Category</Table.Th>
              <Table.Th>Account</Table.Th>
              <Table.Th>Budgeted</Table.Th>
              <Table.Th>Actual</Table.Th>
              <Table.Th>Remaining</Table.Th>
              <Table.Th style={{ minWidth: 140 }}>Usage</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text ta="center" c="dimmed" py="md" size="sm">
                    No {title.toLowerCase()} budgets for this month
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              <>
                {rows.map((b) => (
                  <Table.Tr key={b.id}>
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {b.category}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      {" "}
                      <Text size="sm" c={b.account ? undefined : "dimmed"}>
                        {b.account || "All accounts"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      {" "}
                      <Text size="sm">
                        {formatAmount(b.amount, b.currency)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text
                        size="sm"
                        c={b.actual > b.amount ? "red" : undefined}
                      >
                        {formatAmount(b.actual, b.currency)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text
                        size="sm"
                        fw={500}
                        c={b.remaining < 0 ? "red" : "teal"}
                      >
                        {b.remaining < 0 ? "-" : ""}
                        {formatAmount(Math.abs(b.remaining), b.currency)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={6} wrap="nowrap">
                        <Progress
                          value={Math.min(b.percentUsed, 100)}
                          color={progressColor(b.percentUsed)}
                          size="sm"
                          style={{ flex: 1 }}
                        />
                        <Text
                          size="xs"
                          w={36}
                          ta="right"
                          c={progressColor(b.percentUsed)}
                        >
                          {b.percentUsed.toFixed(0)}%
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <Tooltip label="Edit">
                          <ActionIcon
                            variant="subtle"
                            size="sm"
                            aria-label="Edit budget"
                            onClick={() => onEdit(b)}
                          >
                            <IconEdit size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Delete">
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="sm"
                            aria-label="Delete budget"
                            onClick={() => onDelete(b)}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                <Table.Tr>
                  <Table.Td>
                    <Text size="sm" fw={700}>
                      Total
                    </Text>
                  </Table.Td>
                  <Table.Td />
                  <Table.Td>
                    <Text size="sm" fw={700}>
                      {formatAmount(totalBudgeted, currency)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text
                      size="sm"
                      fw={700}
                      c={totalActual > totalBudgeted ? "red" : undefined}
                    >
                      {formatAmount(totalActual, currency)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text
                      size="sm"
                      fw={700}
                      c={totalRemaining < 0 ? "red" : "teal"}
                    >
                      {totalRemaining < 0 ? "-" : ""}
                      {formatAmount(Math.abs(totalRemaining), currency)}
                    </Text>
                  </Table.Td>
                  <Table.Td />
                  <Table.Td />
                </Table.Tr>
              </>
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Paper>
  );
}

export default function BudgetingPage() {
  const [month, setMonth] = useState(() =>
    new Date().toISOString().slice(0, 7),
  );
  const [modalOpen, { open, close }] = useDisclosure(false);
  const [editTarget, setEditTarget] = useState<BudgetWithActual | null>(null);

  const { data, isLoading, error } = useBudgets(month);
  const { data: categoriesData } = useCategories();
  const { data: accountsData } = useAccounts();
  const createBudget = useCreateBudget(month);
  const updateBudget = useUpdateBudget(month);
  const deleteBudget = useDeleteBudget(month);

  const form = useForm<BudgetForm>({
    initialValues: {
      category: "",
      type: "expense",
      amount: 0,
      currency: "IDR",
      account: "",
    },
    validate: {
      category: (v) => (!v ? "Category required" : null),
      amount: (v) => (v <= 0 ? "Amount must be positive" : null),
    },
  });

  const categoryOptions = (categoriesData?.categories ?? []).map((c) => ({
    value: c.name,
    label: c.parentId ? `  ↳ ${c.name}` : c.name,
  }));

  const accountOptions = [
    { value: "", label: "All accounts (unassigned)" },
    ...(accountsData?.accounts ?? []).map((a) => ({
      value: a.name,
      label: a.name,
    })),
  ];

  function handleEdit(b: BudgetWithActual) {
    setEditTarget(b);
    form.setValues({
      category: b.category,
      type: b.type,
      amount: b.amount,
      currency: b.currency,
      account: b.account ?? "",
    });
    open();
  }

  function handleDelete(b: BudgetWithActual) {
    modals.openConfirmModal({
      title: "Delete budget entry",
      children: `Delete budget for "${b.category}"?`,
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await deleteBudget.mutateAsync(b.rowIndex);
          notifications.show({ color: "green", message: "Budget deleted" });
        } catch (err) {
          notifications.show({ color: "red", message: (err as Error).message });
        }
      },
    });
  }

  async function handleSubmit(values: BudgetForm) {
    try {
      if (editTarget) {
        await updateBudget.mutateAsync({
          rowId: editTarget.rowIndex,
          data: {
            ...editTarget,
            category: values.category,
            type: values.type,
            amount: values.amount,
            currency: values.currency,
            account: values.account,
          } as Budget,
        });
        notifications.show({ color: "green", message: "Budget updated" });
      } else {
        await createBudget.mutateAsync({
          month,
          category: values.category,
          type: values.type,
          amount: values.amount,
          currency: values.currency,
          account: values.account,
        });
        notifications.show({ color: "green", message: "Budget entry added" });
      }
      form.reset();
      setEditTarget(null);
      close();
    } catch (err) {
      notifications.show({ color: "red", message: (err as Error).message });
    }
  }

  const budgets = data?.budgets ?? [];
  const expenses = budgets.filter((b) => b.type === "expense");
  const incomes = budgets.filter((b) => b.type === "income");
  const monthOptions = getMonthOptions();

  return (
    <>
      <Modal
        opened={modalOpen}
        onClose={() => {
          close();
          setEditTarget(null);
          form.reset();
        }}
        title={editTarget ? "Edit Budget Entry" : "Add Budget Entry"}
        aria-label="Budget form"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <Select
              label="Category"
              required
              data={categoryOptions}
              searchable
              clearable
              nothingFoundMessage="No categories â€” add one in Categories"
              aria-label="Category"
              {...form.getInputProps("category")}
            />
            <Select
              label="Type"
              required
              data={[
                { value: "expense", label: "Expense" },
                { value: "income", label: "Income" },
              ]}
              aria-label="Budget type"
              {...form.getInputProps("type")}
            />
            <NumberInput
              label="Budgeted Amount"
              required
              min={0}
              decimalScale={0}
              thousandSeparator=","
              aria-label="Budgeted amount"
              {...form.getInputProps("amount")}
            />
            <Select
              label="Currency"
              data={["IDR", "USD", "EUR", "GBP", "JPY", "SGD"]}
              aria-label="Currency"
              {...form.getInputProps("currency")}
            />
            <Select
              label="Account"
              description="Leave as 'All accounts' or assign to a specific account"
              data={accountOptions}
              clearable={false}
              searchable
              aria-label="Account"
              {...form.getInputProps("account")}
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={close} type="button">
                Cancel
              </Button>
              <Button
                type="submit"
                loading={createBudget.isPending || updateBudget.isPending}
              >
                {editTarget ? "Update" : "Add"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Group justify="space-between" mb="lg">
        <Title order={2}>Budgeting</Title>
        <Group gap="sm">
          <Select
            data={monthOptions}
            value={month}
            onChange={(v) => v && setMonth(v)}
            w={180}
            aria-label="Select month"
          />
          <Button leftSection={<IconPlus size={16} />} onClick={open}>
            Add Entry
          </Button>
        </Group>
      </Group>

      {error ? (
        <Alert icon={<IconAlertCircle />} color="orange">
          {(error as Error).message}
        </Alert>
      ) : isLoading ? (
        <Stack>
          <Skeleton height={200} />
          <Skeleton height={200} />
        </Stack>
      ) : budgets.length === 0 ? (
        <Paper withBorder radius="md" p="xl">
          <Stack align="center" gap="sm">
            <IconWallet size={40} color="var(--mantine-color-dimmed)" />
            <Text c="dimmed" ta="center">
              No budget entries for{" "}
              {monthOptions.find((m) => m.value === month)?.label ?? month}.
              <br />
              Click &quot;Add Entry&quot; to set your monthly budget
              allocations.
            </Text>
          </Stack>
        </Paper>
      ) : (
        <>
          <BudgetSection
            title="Expenses"
            color="red"
            rows={expenses}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          <BudgetSection
            title="Income"
            color="green"
            rows={incomes}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </>
      )}
    </>
  );
}
