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
import type { PortfolioAssetType, PortfolioHolding } from "../../types";
import { GOOGLEFINANCE_ASSET_TYPES } from "../../types";

const ASSET_TYPE_OPTIONS: { value: PortfolioAssetType; label: string }[] = [
  { value: "stock", label: "Stock" },
  { value: "etf", label: "ETF" },
  { value: "mutual-fund", label: "Mutual Fund" },
  { value: "crypto", label: "Crypto" },
  { value: "bond", label: "Bond" },
  { value: "commodity", label: "Commodity" },
  { value: "real-estate", label: "Real Estate" },
  { value: "cash", label: "Cash / Savings" },
  { value: "other", label: "Other" },
];

const STOCK_EXCHANGES = [
  "IDX",
  "NASDAQ",
  "NYSE",
  "SGX",
  "HKEX",
  "LSE",
  "Other",
];
const CRYPTO_EXCHANGES = ["Binance", "Coinbase", "Kraken", "OKX", "Other"];
const OTHER_EXCHANGES = [
  "Bank",
  "BEI",
  "OTC",
  "COMEX",
  "NYMEX",
  "Direct",
  "Other",
];
const ALL_EXCHANGES = [
  ...new Set([...STOCK_EXCHANGES, ...CRYPTO_EXCHANGES, ...OTHER_EXCHANGES]),
];

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

const TICKER_SEARCH_TYPES: PortfolioAssetType[] = [
  "stock",
  "etf",
  "mutual-fund",
];

interface Props {
  opened: boolean;
  onClose: () => void;
  editing?: PortfolioHolding | null;
}

interface FormValues {
  assetType: PortfolioAssetType;
  ticker: string;
  name: string;
  exchange: string;
  lots: number;
  avgPrice: number;
  currency: string;
  sector: string;
  purchaseDate: string;
  notes: string;
  manualPrice: number;
}

const IDX_LOT_SIZE = 100;

function calcShares(
  lots: number,
  exchange: string,
  assetType: PortfolioAssetType,
): number {
  if (assetType === "stock" && exchange === "IDX") return lots * IDX_LOT_SIZE;
  return lots;
}

function getLotsLabel(assetType: PortfolioAssetType, exchange: string): string {
  if (assetType === "stock" && exchange === "IDX")
    return "Lots (1 lot = 100 shares)";
  if (
    assetType === "stock" ||
    assetType === "etf" ||
    assetType === "mutual-fund"
  )
    return "Shares";
  if (assetType === "crypto") return "Quantity (e.g. 0.5 BTC)";
  if (assetType === "cash") return "Balance";
  return "Quantity / Units";
}

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

  const editingAssetType: PortfolioAssetType = (editing?.assetType ??
    "stock") as PortfolioAssetType;
  const isEditingGF = GOOGLEFINANCE_ASSET_TYPES.includes(editingAssetType);

  const form = useForm<FormValues>({
    initialValues: editing
      ? {
          assetType: editingAssetType,
          ticker: editing.ticker,
          name: editing.name,
          exchange: editing.exchange,
          lots: editing.lots,
          avgPrice: editing.avgPrice,
          currency: editing.currency,
          sector: editing.sector,
          purchaseDate: editing.purchaseDate,
          notes: editing.notes,
          manualPrice: isEditingGF ? 0 : editing.currentPrice,
        }
      : {
          assetType: "stock",
          ticker: "",
          name: "",
          exchange: "IDX",
          lots: 0,
          avgPrice: 0,
          currency: "IDR",
          sector: "",
          purchaseDate: new Date().toISOString().slice(0, 10),
          notes: "",
          manualPrice: 0,
        },
    validate: {
      ticker: () => null,
      avgPrice: (v) => (v <= 0 ? "Average price must be positive" : null),
      lots: (v) => (v < 0 ? "Quantity cannot be negative" : null),
    },
  });

  const isGF = GOOGLEFINANCE_ASSET_TYPES.includes(form.values.assetType);
  const useTickerSearch = TICKER_SEARCH_TYPES.includes(form.values.assetType);

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
    if (!useTickerSearch) return;
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
          label: `${r.symbol} â€“ ${r.shortname}`,
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
  }, [debouncedSearch, useTickerSearch]);

  async function handleSubmit(values: FormValues) {
    const ticker = values.ticker.trim() || tickerSearch.trim().toUpperCase();
    if (!ticker) {
      form.setFieldError("ticker", "Identifier is required");
      return;
    }
    const shares = calcShares(values.lots, values.exchange, values.assetType);
    const payload = {
      ...values,
      ticker,
      shares,
      manualPrice: isGF ? undefined : values.manualPrice,
    };
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
  const lotsLabel = getLotsLabel(form.values.assetType, form.values.exchange);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={editing ? "Edit Holding" : "Add Holding"}
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          {/* Asset Type */}
          <Select
            label="Asset Type"
            data={ASSET_TYPE_OPTIONS}
            required
            {...form.getInputProps("assetType")}
            onChange={(v) => {
              const at = (v ?? "stock") as PortfolioAssetType;
              form.setFieldValue("assetType", at);
              // Reset exchange to sensible default when switching types
              if (at === "crypto") form.setFieldValue("exchange", "Binance");
              else if (at === "cash") form.setFieldValue("exchange", "Bank");
              else if (at === "real-estate")
                form.setFieldValue("exchange", "Direct");
              else if (at === "bond" || at === "commodity" || at === "other")
                form.setFieldValue("exchange", "Other");
              else form.setFieldValue("exchange", "IDX");
            }}
          />

          {/* Ticker / Identifier */}
          {useTickerSearch ? (
            <Select
              label="Ticker"
              placeholder="Search ticker or company nameâ€¦"
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
                    <Text size="sm">Searchingâ€¦</Text>
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
          ) : (
            <TextInput
              label={
                form.values.assetType === "crypto"
                  ? "Ticker / Symbol"
                  : form.values.assetType === "cash"
                    ? "Account Name / Identifier"
                    : form.values.assetType === "real-estate"
                      ? "Property Identifier"
                      : "Identifier / Symbol"
              }
              placeholder={
                form.values.assetType === "crypto"
                  ? "e.g. BTC, ETH, SOL"
                  : form.values.assetType === "bond"
                    ? "e.g. SBR013, FR0091"
                    : form.values.assetType === "cash"
                      ? "e.g. BCA-SAVINGS, DEPOSITO-1"
                      : form.values.assetType === "real-estate"
                        ? "e.g. PROPERTY-JAKARTA-1"
                        : "e.g. GOLD, OIL"
              }
              required
              value={form.values.ticker}
              onChange={(e) =>
                form.setFieldValue(
                  "ticker",
                  e.currentTarget.value.toUpperCase(),
                )
              }
              error={form.errors.ticker}
            />
          )}

          <Group grow>
            <Select
              label="Exchange / Platform"
              data={ALL_EXCHANGES}
              searchable
              {...form.getInputProps("exchange")}
              onChange={(v) => {
                form.setFieldValue("exchange", v ?? "Other");
                if (v === "IDX") form.setFieldValue("currency", "IDR");
                else if (v === "SGX") form.setFieldValue("currency", "SGD");
                else if (v === "HKEX") form.setFieldValue("currency", "HKD");
                else if (v === "LSE") form.setFieldValue("currency", "GBP");
                else if (v === "Bank") form.setFieldValue("currency", "IDR");
              }}
            />
            <TextInput
              label="Company / Asset Name"
              placeholder={
                form.values.assetType === "cash"
                  ? "e.g. BCA Tabungan"
                  : form.values.assetType === "real-estate"
                    ? "e.g. Ruko BSD City"
                    : "e.g. Bank Central Asia"
              }
              {...form.getInputProps("name")}
            />
          </Group>

          <Group grow>
            <NumberInput
              label={lotsLabel}
              min={0}
              decimalScale={form.values.assetType === "crypto" ? 8 : 0}
              {...form.getInputProps("lots")}
            />
            <NumberInput
              label={
                <Tooltip
                  label={
                    form.values.assetType === "cash"
                      ? "Average cost or initial deposit amount"
                      : form.values.assetType === "real-estate"
                        ? "Purchase price of the property"
                        : "Weighted average cost per unit across all buy transactions"
                  }
                  withArrow
                  multiline
                  maw={220}
                >
                  <span style={{ cursor: "help", borderBottom: "1px dashed" }}>
                    {form.values.assetType === "cash"
                      ? "Cost / Unit"
                      : "Avg. Price / Unit"}
                  </span>
                </Tooltip>
              }
              min={0}
              thousandSeparator=","
              decimalScale={form.values.assetType === "crypto" ? 8 : 0}
              required
              {...form.getInputProps("avgPrice")}
            />
          </Group>

          {/* Manual Price â€” shown for non-GOOGLEFINANCE asset types */}
          {!isGF && (
            <NumberInput
              label={
                <Tooltip
                  label="Current estimated market value per unit. Used for P&L calculations since automatic pricing is not available for this asset type."
                  withArrow
                  multiline
                  maw={240}
                >
                  <span style={{ cursor: "help", borderBottom: "1px dashed" }}>
                    Current Price (manual)
                  </span>
                </Tooltip>
              }
              placeholder="Enter current market value per unit"
              min={0}
              thousandSeparator=","
              decimalScale={form.values.assetType === "crypto" ? 8 : 0}
              {...form.getInputProps("manualPrice")}
            />
          )}

          <Group grow>
            <Select
              label="Currency"
              data={["IDR", "USD", "SGD", "HKD", "GBP", "EUR", "USDT"]}
              {...form.getInputProps("currency")}
            />
            <Select
              label="Sector / Category"
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
