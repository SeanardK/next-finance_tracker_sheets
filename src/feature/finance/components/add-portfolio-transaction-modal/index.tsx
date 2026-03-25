"use client";

import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Textarea,
  Tooltip,
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

const NO_LOTS_TYPES = [
  "dividend",
  "interest",
  "coupon",
  "staking_reward",
  "deposit",
  "withdrawal",
];

function getPriceLabel(type: string): string {
  switch (type) {
    case "dividend":
      return "Dividend per Share";
    case "interest":
      return "Interest Amount";
    case "coupon":
      return "Coupon Payment";
    case "staking_reward":
      return "Reward Amount";
    case "deposit":
      return "Deposit Amount";
    case "withdrawal":
      return "Withdrawal Amount";
    case "split":
      return "Split Ratio (e.g. 2 for 2-for-1)";
    default:
      return "Price / Share";
  }
}

function getTypeDescription(type: string): string | undefined {
  switch (type) {
    case "split":
      return "Stock Split: adjust share count (e.g. 2-for-1). Set ratio to 2.";
    case "dividend":
      return "Cash dividend received per share held.";
    case "interest":
      return "Interest income received (savings, bonds, etc.)";
    case "coupon":
      return "Bond coupon payment received.";
    case "staking_reward":
      return "Crypto staking or yield reward.";
    case "deposit":
      return "Cash deposited into this position.";
    case "withdrawal":
      return "Cash withdrawn from this position.";
    default:
      return undefined;
  }
}

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
        values.type !== "split" && v <= 0 ? "Amount must be positive" : null,
    },
  });

  const tickerOptions = [...new Set(holdings.map((h) => h.ticker))].map(
    (t) => ({ value: t, label: t }),
  );

  const selectedHolding = holdings.find((h) => h.ticker === form.values.ticker);
  const lotSize = selectedHolding?.exchange === "IDX" ? IDX_LOT_SIZE : 1;

  const isNoLotsType = NO_LOTS_TYPES.includes(form.values.type);

  async function handleSubmit(values: FormValues) {
    let shares: number;
    if (
      [
        "deposit",
        "withdrawal",
        "interest",
        "coupon",
        "staking_reward",
      ].includes(values.type)
    ) {
      shares = 1;
    } else if (values.type === "dividend") {
      shares = values.lots;
    } else {
      shares = values.lots * lotSize;
    }

    const payload = {
      ...values,
      type: values.type as PortfolioTransaction["type"],
      shares,
    };
    try {
      if (editing) {
        await update.mutateAsync({ rowId: editing.rowIndex, data: payload });
        notifications.show({ color: "green", message: "Transaction updated" });
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

  const isPending = create.isPending || update.isPending;
  const typeDescription = getTypeDescription(form.values.type);
  const priceLabel = getPriceLabel(form.values.type);

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
              label="Asset / Ticker"
              data={tickerOptions}
              searchable
              required
              {...form.getInputProps("ticker")}
            />
            <Select
              label="Type"
              data={[
                {
                  group: "Trade",
                  items: [
                    { value: "buy", label: "Buy" },
                    { value: "sell", label: "Sell" },
                    { value: "split", label: "Stock Split" },
                  ],
                },
                {
                  group: "Income",
                  items: [
                    { value: "dividend", label: "Dividend" },
                    { value: "interest", label: "Interest" },
                    { value: "coupon", label: "Coupon Payment" },
                    { value: "staking_reward", label: "Staking Reward" },
                  ],
                },
                {
                  group: "Cash Flow",
                  items: [
                    { value: "deposit", label: "Deposit" },
                    { value: "withdrawal", label: "Withdrawal" },
                  ],
                },
              ]}
              description={typeDescription}
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
            {![
              "deposit",
              "withdrawal",
              "interest",
              "coupon",
              "staking_reward",
            ].includes(form.values.type) && (
              <NumberInput
                label={
                  form.values.type === "dividend"
                    ? "Shares that received dividend"
                    : selectedHolding?.exchange === "IDX"
                      ? "Lots"
                      : "Shares / Units"
                }
                min={0}
                {...form.getInputProps("lots")}
              />
            )}
            <NumberInput
              label={
                <Tooltip label={priceLabel} withArrow multiline maw={200}>
                  <span style={{ cursor: "help", borderBottom: "1px dashed" }}>
                    {priceLabel}
                  </span>
                </Tooltip>
              }
              min={0}
              thousandSeparator=","
              required={form.values.type !== "split"}
              {...form.getInputProps("price")}
            />
          </Group>

          {!isNoLotsType && (
            <Group grow>
              <NumberInput
                label={
                  <Tooltip
                    label="Brokerage or platform fee paid for this transaction."
                    withArrow
                    multiline
                    maw={220}
                  >
                    <span
                      style={{ cursor: "help", borderBottom: "1px dashed" }}
                    >
                      Transaction Fee
                    </span>
                  </Tooltip>
                }
                min={0}
                thousandSeparator=","
                {...form.getInputProps("fee")}
              />
              <Select
                label="Currency"
                data={["IDR", "USD", "SGD", "HKD", "GBP", "EUR", "USDT"]}
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
