"use client";

import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Textarea,
  TextInput,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useAccounts } from "../../hooks/use-accounts";
import { useCategories } from "../../hooks/use-categories";
import {
  useCreateTransaction,
  useUpdateTransaction,
} from "../../hooks/use-transactions";
import type { Transaction, TransactionFormValues } from "../../types";

interface Props {
  opened: boolean;
  onClose: () => void;
  editingTx?: Transaction | null;
}

export function AddTransactionModal({ opened, onClose, editingTx }: Props) {
  const { data: categoriesData } = useCategories();
  const { data: accountsData } = useAccounts();
  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction();

  const form = useForm<TransactionFormValues>({
    initialValues: editingTx
      ? {
          date: editingTx.date,
          account: editingTx.account,
          category: editingTx.category,
          amount: editingTx.amount,
          currency: editingTx.currency,
          type: editingTx.type,
          description: editingTx.description,
          tags: editingTx.tags,
        }
      : {
          date: new Date().toISOString().slice(0, 10),
          account: "",
          category: "",
          amount: 0,
          currency: "USD",
          type: "expense",
          description: "",
          tags: "",
        },
    validate: {
      date: (v) => (!v ? "Date is required" : null),
      amount: (v) => (v <= 0 ? "Amount must be positive" : null),
      type: (v) => (!v ? "Type is required" : null),
    },
  });

  const categoryOptions = (categoriesData?.categories ?? []).map((c) => ({
    value: c.name,
    label: c.parentId ? `  ↳ ${c.name}` : c.name,
  }));

  const accountOptions = (accountsData?.accounts ?? []).map((a) => ({
    value: a.name,
    label: a.name,
  }));

  async function handleSubmit(values: TransactionFormValues) {
    try {
      if (editingTx) {
        await updateTx.mutateAsync({
          rowId: editingTx.rowIndex,
          data: {
            ...values,
            externalId: editingTx.externalId,
            createdAt: editingTx.createdAt,
          },
        });
        notifications.show({ color: "green", message: "Transaction updated" });
      } else {
        await createTx.mutateAsync(values);
        notifications.show({ color: "green", message: "Transaction added" });
      }
      form.reset();
      onClose();
    } catch (err) {
      notifications.show({ color: "red", message: (err as Error).message });
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={editingTx ? "Edit Transaction" : "Add Transaction"}
      size="md"
      aria-label={editingTx ? "Edit transaction form" : "Add transaction form"}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <DateInput
            label="Date"
            required
            aria-label="Transaction date"
            value={form.values.date ? new Date(form.values.date) : null}
            onChange={(d) =>
              form.setFieldValue("date", d ? d.toISOString().slice(0, 10) : "")
            }
            error={form.errors.date}
          />

          <Select
            label="Account"
            data={accountOptions}
            searchable
            clearable
            nothingFoundMessage="No accounts — add one in Accounts"
            aria-label="Account"
            {...form.getInputProps("account")}
          />

          <Select
            label="Type"
            required
            data={[
              { value: "income", label: "Income" },
              { value: "expense", label: "Expense" },
              { value: "transfer", label: "Transfer" },
            ]}
            aria-label="Transaction type"
            {...form.getInputProps("type")}
          />

          <NumberInput
            label="Amount"
            required
            min={0}
            decimalScale={2}
            aria-label="Amount"
            {...form.getInputProps("amount")}
          />

          <Select
            defaultValue={"IDR"}
            label="Currency"
            data={["USD", "EUR", "GBP", "IDR", "JPY", "SGD"]}
            aria-label="Currency"
            {...form.getInputProps("currency")}
          />

          <Select
            label="Category"
            data={categoryOptions}
            searchable
            clearable
            nothingFoundMessage="No categories — add one in Categories"
            aria-label="Category"
            {...form.getInputProps("category")}
          />

          <Textarea
            label="Description"
            rows={2}
            aria-label="Description"
            {...form.getInputProps("description")}
          />

          <TextInput
            label="Tags (comma-separated)"
            placeholder="food, bills, transport"
            aria-label="Tags"
            {...form.getInputProps("tags")}
          />

          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createTx.isPending || updateTx.isPending}
            >
              {editingTx ? "Update" : "Add"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
