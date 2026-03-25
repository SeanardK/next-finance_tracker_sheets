"use client";

import {
  Button,
  Group,
  Loader,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  Tooltip,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useDebouncedValue } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useEffect, useRef, useState } from "react";
import type { TickerResult } from "@/app/api/finance/portfolio/ticker-search/route";
import { useCreateHolding, useUpdateHolding } from "../../hooks/use-portfolio";
import type { PortfolioHolding } from "../../types";

const EXCHANGES = ["IDX", "NASDAQ", "NYSE", "SGX", "HKEX", "LSE", "Other"];
const SECTORS = [
  "Financials",
  "Consumer Goods",
  "Healthcare",
  "Technology",
  "Energy",
  "Utilities",
  "Industrials",
  "Materials",
  "Real Estate",
  "Telecommunication",
  "Infrastructure",
  "Other",
];

interface Props {
  opened: boolean;
  onClose: () => void;
  editing?: PortfolioHolding | null;
}

interface FormValues {
  ticker: string;
  name: string;
  exchange: string;
  lots: number;
  avgPrice: number;
  currency: string;
  sector: string;
  purchaseDate: string;
  notes: string;
}

const IDX_LOT_SIZE = 100;

export function AddHoldingModal({ opened, onClose, editing }: Props) {
  const create = useCreateHolding();
  const update = useUpdateHolding();

  const [tickerSearch, setTickerSearch] = useState(editing?.ticker ?? "");
  const [debouncedSearch] = useDebouncedValue(tickerSearch, 350);
  const [tickerOptions, setTickerOptions] = useState<
    { value: string; label: string; meta: TickerResult }[]
  >([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(editing?.ticker ?? "");

  const form = useForm<FormValues>({
    initialValues: editing
      ? {
          ticker: editing.ticker,
          name: editing.name,
          exchange: editing.exchange,
          lots: editing.lots,
          avgPrice: editing.avgPrice,
          currency: editing.currency,
          sector: editing.sector,
          purchaseDate: editing.purchaseDate,
          notes: editing.notes,
        }
      : {
          ticker: "",
          name: "",
          exchange: "IDX",
          lots: 0,
          avgPrice: 0,
          currency: "IDR",
          sector: "",
          purchaseDate: new Date().toISOString().slice(0, 10),
          notes: "",
        },
    validate: {
      ticker: () => null,
      avgPrice: (v) => (v <= 0 ? "Average price must be positive" : null),
      lots: (v) => (v < 0 ? "Lots cannot be negative" : null),
    },
  });

  const fillFromMetaRef = useRef<
    ((val: string, meta: TickerResult) => void) | null
  >(null);
  fillFromMetaRef.current = (val: string, meta: TickerResult) => {
    form.setFieldValue("ticker", val);
    setTickerSearch(val);
    form.setFieldValue("name", meta.longname || meta.shortname);
    const ex = meta.exchange;
    const isIDX = ex === "JKT" || val.endsWith(".JK");
    const detectedExchange = isIDX
      ? "IDX"
      : ex === "NMS" || ex === "NGM" || ex === "NCM"
        ? "NASDAQ"
        : ex === "NYQ"
          ? "NYSE"
          : ex === "SES"
            ? "SGX"
            : ex === "HKG"
              ? "HKEX"
              : ex === "LSE"
                ? "LSE"
                : form.values.exchange;
    form.setFieldValue("exchange", detectedExchange);
    form.setFieldValue(
      "currency",
      isIDX
        ? "IDR"
        : detectedExchange === "SGX"
          ? "SGD"
          : detectedExchange === "HKEX"
            ? "HKD"
            : detectedExchange === "LSE"
              ? "GBP"
              : "USD",
    );
  };

  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 1) {
      setTickerOptions([]);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    fetch(
      `/api/finance/portfolio/ticker-search?q=${encodeURIComponent(debouncedSearch)}`,
    )
      .then((r) => r.json())
      .then(({ results }: { results: TickerResult[] }) => {
        if (cancelled) return;
        const options = results.map((r) => ({
          value: r.symbol,
          label: `${r.symbol} — ${r.shortname}`,
          meta: r,
        }));
        setTickerOptions(options);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSearchLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  function calcShares(lots: number, exchange: string): number {
    return exchange === "IDX" ? lots * IDX_LOT_SIZE : lots;
  }

  async function handleSubmit(values: FormValues) {
    // Accept either a dropdown-selected ticker or whatever the user typed
    const ticker = values.ticker.trim() || tickerSearch.trim().toUpperCase();
    if (!ticker) {
      form.setFieldError("ticker", "Ticker is required");
      return;
    }
    const shares = calcShares(values.lots, values.exchange);
    const payload = { ...values, ticker, shares };
    try {
      if (editing) {
        await update.mutateAsync({ rowId: editing.rowIndex, data: payload });
        notifications.show({ color: "green", message: "Holding updated" });
      } else {
        await create.mutateAsync(payload);
        notifications.show({ color: "green", message: "Holding added" });
      }
      form.reset();
      onClose();
    } catch (err) {
      notifications.show({ color: "red", message: (err as Error).message });
    }
  }

  const isPending = create.isPending || update.isPending;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={editing ? "Edit Holding" : "Add Holding"}
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <Select
            label="Ticker"
            placeholder="Search ticker or company name…"
            required
            searchable
            data={[
              ...tickerOptions,
              ...(form.values.ticker &&
              !tickerOptions.some((o) => o.value === form.values.ticker)
                ? [
                    {
                      value: form.values.ticker,
                      label: selectedLabel || form.values.ticker,
                    },
                  ]
                : []),
            ]}
            value={form.values.ticker || null}
            searchValue={tickerSearch}
            onSearchChange={(val) => {
              if (!val && form.values.ticker) {
                setTickerSearch(form.values.ticker);
                return;
              }
              setTickerSearch(val);
            }}
            onChange={(val) => {
              if (!val) return;
              const match = tickerOptions.find((o) => o.value === val);
              setSelectedLabel(match ? match.label : val);
              form.setFieldValue("ticker", val);
              setTickerSearch(val);
              if (match) fillFromMetaRef.current?.(match.value, match.meta);
            }}
            error={form.errors.ticker}
            nothingFoundMessage={
              searchLoading ? (
                <Group gap="xs">
                  <Loader size="xs" />
                  <Text size="sm">Searching…</Text>
                </Group>
              ) : tickerSearch.length > 0 ? (
                "No results. Check spelling or enter manually."
              ) : (
                "Type to search"
              )
            }
            filter={({ options }) => options}
            aria-label="Ticker search"
          />

          <Select
            label="Exchange"
            data={EXCHANGES}
            required
            {...form.getInputProps("exchange")}
            onChange={(v) => {
              form.setFieldValue("exchange", v ?? "IDX");
              form.setFieldValue("currency", v === "IDX" ? "IDR" : "USD");
            }}
          />

          <TextInput
            label="Company Name"
            placeholder="e.g. Bank Central Asia"
            {...form.getInputProps("name")}
          />

          <Group grow>
            <NumberInput
              label={
                <Tooltip
                  label={
                    form.values.exchange === "IDX"
                      ? "Number of lots. On IDX, 1 lot = 100 shares. For other exchanges this equals the number of shares directly."
                      : "Number of shares to record for this holding."
                  }
                  withArrow
                  multiline
                  maw={220}
                >
                  <span style={{ cursor: "help", borderBottom: "1px dashed" }}>
                    {form.values.exchange === "IDX"
                      ? "Lots (1 lot = 100 shares)"
                      : "Lots / Shares"}
                  </span>
                </Tooltip>
              }
              min={0}
              {...form.getInputProps("lots")}
            />
            <NumberInput
              label={
                <Tooltip
                  label="Weighted average cost per share across all your buy transactions for this holding."
                  withArrow
                  multiline
                  maw={220}
                >
                  <span style={{ cursor: "help", borderBottom: "1px dashed" }}>
                    Avg. Price / Share
                  </span>
                </Tooltip>
              }
              min={0}
              thousandSeparator=","
              required
              {...form.getInputProps("avgPrice")}
            />
          </Group>

          <Group grow>
            <Select
              label="Currency"
              data={["IDR", "USD", "SGD", "HKD", "GBP"]}
              {...form.getInputProps("currency")}
            />
            <Select
              label="Sector"
              data={SECTORS}
              clearable
              {...form.getInputProps("sector")}
            />
          </Group>

          <DateInput
            label="Purchase Date"
            valueFormat="YYYY-MM-DD"
            value={
              form.values.purchaseDate
                ? new Date(form.values.purchaseDate)
                : null
            }
            onChange={(d) =>
              form.setFieldValue(
                "purchaseDate",
                d ? d.toISOString().slice(0, 10) : "",
              )
            }
          />

          <Textarea label="Notes" rows={2} {...form.getInputProps("notes")} />

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              {editing ? "Update" : "Add"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
