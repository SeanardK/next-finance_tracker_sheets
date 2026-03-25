"use client";

import {
  Alert,
  Button,
  Group,
  Paper,
  Select,
  Skeleton,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconDownload,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { AddTransactionModal } from "@/feature/finance/components/add-transaction-modal";
import { TransactionTable } from "@/feature/finance/components/transaction-table";
import { useCategories } from "@/feature/finance/hooks/use-categories";
import {
  useDeleteTransaction,
  useTransactions,
} from "@/feature/finance/hooks/use-transactions";
import type { Transaction } from "@/feature/finance/types";

export default function TransactionsPage() {
  const { data, isLoading, error } = useTransactions(200, 0);
  const { data: catData } = useCategories();
  // const { data: accData } = useAccounts();
  const deleteTx = useDeleteTransaction();

  const [addOpen, setAddOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);

  const transactions = useMemo(() => {
    let list = data?.transactions ?? [];
    const [dateFrom, dateTo] = dateRange;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (tx) =>
          tx.description.toLowerCase().includes(q) ||
          tx.category.toLowerCase().includes(q),
      );
    }
    if (filterCat) list = list.filter((tx) => tx.category === filterCat);
    if (filterType) list = list.filter((tx) => tx.type === filterType);
    if (dateFrom) {
      const from = dateFrom.toISOString().slice(0, 10);
      list = list.filter((tx) => tx.date >= from);
    }
    if (dateTo) {
      const to = dateTo.toISOString().slice(0, 10);
      list = list.filter((tx) => tx.date <= to);
    }
    return list;
  }, [data, search, filterCat, filterType, dateRange]);

  function handleEdit(tx: Transaction) {
    setEditingTx(tx);
    setAddOpen(true);
  }

  function handleDelete(tx: Transaction) {
    modals.openConfirmModal({
      title: "Delete transaction",
      children: `Delete "${tx.description || tx.category || tx.date}"?`,
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await deleteTx.mutateAsync(tx.rowIndex);
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

  if (error) {
    return (
      <Alert icon={<IconAlertCircle />} color="orange" title="Error">
        {(error as Error).message}
      </Alert>
    );
  }

  const categoryOptions = (catData?.categories ?? []).map((c) => ({
    value: c.name,
    label: c.name,
  }));

  return (
    <>
      <AddTransactionModal
        opened={addOpen}
        onClose={() => {
          setAddOpen(false);
          setEditingTx(null);
        }}
        editingTx={editingTx}
      />

      <Group justify="space-between" mb="lg" wrap="wrap" gap="sm">
        <Title order={2}>Transactions</Title>
        <Group wrap="wrap" gap="xs">
          <Button
            variant="default"
            leftSection={<IconDownload size={16} />}
            component="a"
            href="/api/finance/import-export"
          >
            Export CSV
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setAddOpen(true)}
          >
            Add Transaction
          </Button>
        </Group>
      </Group>

      {/* Filters */}
      <Paper withBorder p="sm" radius="md" mb="md">
        <Stack gap="sm">
          <Group grow>
            <TextInput
              placeholder="Search..."
              leftSection={<IconSearch size={14} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              aria-label="Search transactions"
            />
            <Select
              placeholder="All types"
              clearable
              data={[
                { value: "income", label: "Income" },
                { value: "expense", label: "Expense" },
                { value: "transfer", label: "Transfer" },
              ]}
              value={filterType}
              onChange={setFilterType}
              aria-label="Filter by type"
            />
          </Group>
          <Group grow>
            <Select
              placeholder="All categories"
              clearable
              searchable
              data={categoryOptions}
              value={filterCat}
              onChange={setFilterCat}
              aria-label="Filter by category"
            />
            <DatePickerInput
              size="md"
              type="range"
              placeholder="Pick date range"
              value={dateRange}
              onChange={setDateRange}
              clearable
              valueFormat="DD MMM YYYY"
              aria-label="Filter by date range"
            />
          </Group>
        </Stack>
      </Paper>

      {isLoading ? (
        <Skeleton height={300} />
      ) : (
        <Paper withBorder radius="md">
          <TransactionTable
            transactions={transactions}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </Paper>
      )}
    </>
  );
}
