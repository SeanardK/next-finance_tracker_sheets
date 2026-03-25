"use client";

import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Textarea,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  useCreatePortfolioTransaction,
  useUpdatePortfolioTransaction,
} from "../../hooks/use-portfolio";
import type { PortfolioHolding, PortfolioTransaction } from "../../types";

interface Props {
  opened: boolean;
  onClose: () => void;
  editing?: PortfolioTransaction | null;
  holdings: PortfolioHolding[];
}

interface FormValues {
  ticker: string;
  date: string;
  type: string;
  lots: number;
  price: number;
  fee: number;
  currency: string;
  notes: string;
}

const IDX_LOT_SIZE = 100;

export function AddPortfolioTransactionModal({
  opened,
  onClose,
  editing,
  holdings,
}: Props) {
  const create = useCreatePortfolioTransaction();
  const update = useUpdatePortfolioTransaction();

  const form = useForm<FormValues>({
    initialValues: editing
      ? {
          ticker: editing.ticker,
          date: editing.date,
          type: editing.type,
          lots: editing.lots,
          price: editing.price,
          fee: editing.fee,
          currency: editing.currency,
          notes: editing.notes,
        }
      : {
          ticker: "",
          date: new Date().toISOString().slice(0, 10),
          type: "buy",
          lots: 0,
          price: 0,
          fee: 0,
          currency: "IDR",
          notes: "",
        },
    validate: {
      ticker: (v) => (!v.trim() ? "Ticker is required" : null),
      date: (v) => (!v ? "Date is required" : null),
      price: (v, values) =>
        values.type !== "split" && v <= 0 ? "Price must be positive" : null,
    },
  });

  const tickerOptions = [...new Set(holdings.map((h) => h.ticker))].map(
    (t) => ({ value: t, label: t }),
  );

  const selectedHolding = holdings.find((h) => h.ticker === form.values.ticker);
  const lotSize = selectedHolding?.exchange === "IDX" ? IDX_LOT_SIZE : 1;

  async function handleSubmit(values: FormValues) {
    const shares =
      values.type === "dividend" ? values.lots : values.lots * lotSize;
    const payload = {
      ...values,
      type: values.type as PortfolioTransaction["type"],
      shares,
    };
    try {
      if (editing) {
        await update.mutateAsync({
          rowId: editing.rowIndex,
          data: payload,
        });
        notifications.show({
          color: "green",
          message: "Transaction updated",
        });
      } else {
        await create.mutateAsync(payload);
        notifications.show({ color: "green", message: "Transaction added" });
      }
      form.reset();
      onClose();
    } catch (err) {
      notifications.show({ color: "red", message: (err as Error).message });
    }
  }

  const isDividend = form.values.type === "dividend";
  const isPending = create.isPending || update.isPending;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={editing ? "Edit Transaction" : "Log Transaction"}
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <Group grow>
            <Select
              label="Ticker"
              data={tickerOptions}
              searchable
              required
              {...form.getInputProps("ticker")}
            />
            <Select
              label="Type"
              data={[
                { value: "buy", label: "Buy" },
                { value: "sell", label: "Sell" },
                { value: "dividend", label: "Dividend" },
                { value: "split", label: "Stock Split" },
              ]}
              required
              {...form.getInputProps("type")}
            />
          </Group>

          <DateInput
            label="Date"
            valueFormat="YYYY-MM-DD"
            required
            value={form.values.date ? new Date(form.values.date) : null}
            onChange={(d) =>
              form.setFieldValue("date", d ? d.toISOString().slice(0, 10) : "")
            }
          />

          <Group grow>
            {!isDividend && (
              <NumberInput
                label={`${selectedHolding?.exchange === "IDX" ? "Lots" : "Shares"}`}
                min={0}
                {...form.getInputProps("lots")}
              />
            )}
            <NumberInput
              label={isDividend ? "Dividend per Share" : "Price / Share"}
              min={0}
              thousandSeparator=","
              required={form.values.type !== "split"}
              {...form.getInputProps("price")}
            />
          </Group>

          {!isDividend && (
            <Group grow>
              <NumberInput
                label="Transaction Fee"
                min={0}
                thousandSeparator=","
                {...form.getInputProps("fee")}
              />
              <Select
                label="Currency"
                data={["IDR", "USD", "SGD", "HKD", "GBP"]}
                {...form.getInputProps("currency")}
              />
            </Group>
          )}

          <Textarea label="Notes" rows={2} {...form.getInputProps("notes")} />

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              {editing ? "Update" : "Log"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
