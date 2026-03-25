"use client";

import {
  ActionIcon,
  Badge,
  Group,
  NumberFormatter,
  ScrollArea,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowDown,
  IconArrowUp,
  IconEdit,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react";
import type { PortfolioHoldingWithPrice } from "../../types";

interface Props {
  holdings: PortfolioHoldingWithPrice[];
  onEdit: (h: PortfolioHoldingWithPrice) => void;
  onDelete: (h: PortfolioHoldingWithPrice) => void;
  onRefresh?: () => void;
}

function PnlBadge({ value, pct }: { value: number; pct: number }) {
  const positive = value >= 0;
  return (
    <Group gap={4} wrap="nowrap">
      {positive ? (
        <IconArrowUp size={14} color="var(--mantine-color-green-6)" />
      ) : (
        <IconArrowDown size={14} color="var(--mantine-color-red-6)" />
      )}
      <Text
        size="sm"
        c={positive ? "green" : "red"}
        fw={500}
        style={{ whiteSpace: "nowrap" }}
      >
        <NumberFormatter
          value={Math.abs(value)}
          thousandSeparator=","
          decimalScale={0}
        />{" "}
        ({pct >= 0 ? "+" : ""}
        {pct.toFixed(2)}%)
      </Text>
    </Group>
  );
}

export function PortfolioHoldingsTable({
  holdings,
  onEdit,
  onDelete,
  onRefresh,
}: Props) {
  if (holdings.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        No holdings yet. Add your first stock holding.
      </Text>
    );
  }

  return (
    <ScrollArea>
      <Table striped highlightOnHover withTableBorder verticalSpacing="xs">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Ticker</Table.Th>
            <Table.Th>Name</Table.Th>
            <Table.Th ta="right">
              <Tooltip
                label="Number of lots held (1 IDX lot = 100 shares)"
                withArrow
                position="top"
              >
                <span style={{ cursor: "help", borderBottom: "1px dashed" }}>
                  Lots
                </span>
              </Tooltip>
            </Table.Th>
            <Table.Th ta="right">
              <Tooltip
                label="Total number of individual shares held"
                withArrow
                position="top"
              >
                <span style={{ cursor: "help", borderBottom: "1px dashed" }}>
                  Shares
                </span>
              </Tooltip>
            </Table.Th>
            <Table.Th ta="right">
              <Tooltip
                label="Weighted average price paid per share across all buy transactions"
                withArrow
                position="top"
              >
                <span style={{ cursor: "help", borderBottom: "1px dashed" }}>
                  Avg Price
                </span>
              </Tooltip>
            </Table.Th>
            <Table.Th ta="right">
              <Group gap={4} justify="flex-end" wrap="nowrap">
                <Tooltip
                  label="Latest market price. The % shows today's price change from previous close."
                  withArrow
                  position="top"
                >
                  <span style={{ cursor: "help", borderBottom: "1px dashed" }}>
                    Current Price
                  </span>
                </Tooltip>
                {onRefresh && (
                  <Tooltip label="Refresh prices">
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      onClick={onRefresh}
                      aria-label="Refresh market prices"
                    >
                      <IconRefresh size={12} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>
            </Table.Th>
            <Table.Th ta="right">
              <Tooltip
                label="Current market value: shares × current price"
                withArrow
                position="top"
              >
                <span style={{ cursor: "help", borderBottom: "1px dashed" }}>
                  Value
                </span>
              </Tooltip>
            </Table.Th>
            <Table.Th ta="right">
              <Tooltip
                label="Total amount invested: shares × average price paid"
                withArrow
                position="top"
              >
                <span style={{ cursor: "help", borderBottom: "1px dashed" }}>
                  Cost Basis
                </span>
              </Tooltip>
            </Table.Th>
            <Table.Th ta="right">
              <Tooltip
                label="Unrealized Profit & Loss — the gain or loss on open positions that have not been sold yet. = Current Value − Cost Basis"
                withArrow
                position="top"
                multiline
                maw={240}
              >
                <span style={{ cursor: "help", borderBottom: "1px dashed" }}>
                  Unrealized P&amp;L
                </span>
              </Tooltip>
            </Table.Th>
            <Table.Th>Sector</Table.Th>
            <Table.Th>Notes</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {holdings.map((h) => (
            <Table.Tr key={h.id}>
              <Table.Td>
                <Group gap={6} wrap="nowrap">
                  <Text fw={600} size="sm">
                    {h.ticker}
                  </Text>
                  <Badge size="xs" variant="light" color="gray">
                    {h.exchange}
                  </Badge>
                </Group>
              </Table.Td>
              <Table.Td>
                <Text size="sm" lineClamp={1}>
                  {h.name || "—"}
                </Text>
              </Table.Td>
              <Table.Td ta="right">
                <Text size="sm">
                  <NumberFormatter value={h.lots} thousandSeparator="," />
                </Text>
              </Table.Td>
              <Table.Td ta="right">
                <Text size="sm">
                  <NumberFormatter value={h.shares} thousandSeparator="," />
                </Text>
              </Table.Td>
              <Table.Td ta="right">
                <Text size="sm">
                  <NumberFormatter
                    value={h.avgPrice}
                    thousandSeparator=","
                    decimalScale={0}
                  />
                </Text>
              </Table.Td>
              <Table.Td ta="right">
                {h.priceError ? (
                  <Text size="sm" c="dimmed">
                    N/A
                  </Text>
                ) : (
                  <Group gap={4} justify="flex-end" wrap="nowrap">
                    <Text size="sm">
                      <NumberFormatter
                        value={h.currentPrice}
                        thousandSeparator=","
                        decimalScale={0}
                      />
                    </Text>
                    <Text size="xs" c={h.changePercent >= 0 ? "green" : "red"}>
                      ({h.changePercent >= 0 ? "+" : ""}
                      {h.changePercent.toFixed(2)}%)
                    </Text>
                  </Group>
                )}
              </Table.Td>
              <Table.Td ta="right">
                <Text size="sm" fw={500}>
                  <NumberFormatter
                    value={h.currentValue}
                    thousandSeparator=","
                    decimalScale={0}
                  />
                </Text>
              </Table.Td>
              <Table.Td ta="right">
                <Text size="sm">
                  <NumberFormatter
                    value={h.costBasis}
                    thousandSeparator=","
                    decimalScale={0}
                  />
                </Text>
              </Table.Td>
              <Table.Td ta="right">
                {h.priceError ? (
                  <Text size="sm" c="dimmed">
                    N/A
                  </Text>
                ) : (
                  <PnlBadge value={h.unrealizedPnl} pct={h.unrealizedPnlPct} />
                )}
              </Table.Td>
              <Table.Td>
                <Text size="sm" c="dimmed">
                  {h.sector || "—"}
                </Text>
              </Table.Td>
              <Table.Td style={{ maxWidth: 160 }}>
                {h.notes ? (
                  <Tooltip label={h.notes} multiline maw={260} withArrow>
                    <Text
                      size="sm"
                      c="dimmed"
                      lineClamp={1}
                      style={{ cursor: "default" }}
                    >
                      {h.notes}
                    </Text>
                  </Tooltip>
                ) : (
                  <Text size="sm" c="dimmed">
                    —
                  </Text>
                )}
              </Table.Td>
              <Table.Td>
                <Group gap={4} wrap="nowrap">
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    onClick={() => onEdit(h)}
                    aria-label={`Edit ${h.ticker}`}
                  >
                    <IconEdit size={14} />
                  </ActionIcon>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="red"
                    onClick={() => onDelete(h)}
                    aria-label={`Delete ${h.ticker}`}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
