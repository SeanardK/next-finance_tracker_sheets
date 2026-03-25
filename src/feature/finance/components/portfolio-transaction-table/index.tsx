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
import { IconEdit, IconTrash } from "@tabler/icons-react";
import type { PortfolioTransaction } from "../../types";

interface Props {
  transactions: PortfolioTransaction[];
  onEdit: (t: PortfolioTransaction) => void;
  onDelete: (t: PortfolioTransaction) => void;
}

const TYPE_COLOR: Record<string, string> = {
  buy: "green",
  sell: "red",
  dividend: "blue",
  split: "orange",
};

export function PortfolioTransactionTable({
  transactions,
  onEdit,
  onDelete,
}: Props) {
  if (transactions.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        No transactions logged yet.
      </Text>
    );
  }

  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <ScrollArea>
      <Table striped highlightOnHover withTableBorder verticalSpacing="xs">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Date</Table.Th>
            <Table.Th>Ticker</Table.Th>
            <Table.Th>
              <Tooltip
                label="Buy: purchase shares. Sell: dispose shares. Dividend: cash income per share. Stock Split: share count adjustment with no cost change."
                withArrow
                multiline
                maw={240}
                position="top"
              >
                <span style={{ cursor: "help", borderBottom: "1px dashed" }}>
                  Type
                </span>
              </Tooltip>
            </Table.Th>
            <Table.Th ta="right">
              <Tooltip
                label="Number of lots transacted (IDX: 1 lot = 100 shares). Shows — for dividend entries."
                withArrow
                multiline
                maw={200}
                position="top"
              >
                <span style={{ cursor: "help", borderBottom: "1px dashed" }}>
                  Lots
                </span>
              </Tooltip>
            </Table.Th>
            <Table.Th ta="right">
              <Tooltip
                label="Number of individual shares transacted"
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
                label="Price per share for buy/sell, or dividend amount per share for dividend transactions"
                withArrow
                multiline
                maw={200}
                position="top"
              >
                <span style={{ cursor: "help", borderBottom: "1px dashed" }}>
                  Price
                </span>
              </Tooltip>
            </Table.Th>
            <Table.Th ta="right">
              <Tooltip
                label="Brokerage or transaction fee paid"
                withArrow
                position="top"
              >
                <span style={{ cursor: "help", borderBottom: "1px dashed" }}>
                  Fee
                </span>
              </Tooltip>
            </Table.Th>
            <Table.Th ta="right">
              <Tooltip
                label="Total transaction value. Buy/Split: shares × price + fee. Sell: shares × price − fee. Dividend: shares × dividend per share."
                withArrow
                multiline
                maw={240}
                position="top"
              >
                <span style={{ cursor: "help", borderBottom: "1px dashed" }}>
                  Total
                </span>
              </Tooltip>
            </Table.Th>
            <Table.Th>Notes</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {sorted.map((t) => {
            return (
              <Table.Tr key={t.id}>
                <Table.Td>
                  <Text size="sm">{t.date}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" fw={600}>
                    {t.ticker}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge
                    size="sm"
                    color={TYPE_COLOR[t.type] ?? "gray"}
                    variant="light"
                  >
                    {t.type.toUpperCase()}
                  </Badge>
                </Table.Td>
                <Table.Td ta="right">
                  <Text size="sm">
                    {t.type !== "dividend" ? (
                      <NumberFormatter value={t.lots} thousandSeparator="," />
                    ) : (
                      "—"
                    )}
                  </Text>
                </Table.Td>
                <Table.Td ta="right">
                  <Text size="sm">
                    <NumberFormatter value={t.shares} thousandSeparator="," />
                  </Text>
                </Table.Td>
                <Table.Td ta="right">
                  <Text size="sm">
                    <NumberFormatter
                      value={t.price}
                      thousandSeparator=","
                      decimalScale={2}
                    />
                  </Text>
                </Table.Td>
                <Table.Td ta="right">
                  <Text size="sm" c="dimmed">
                    <NumberFormatter
                      value={t.fee}
                      thousandSeparator=","
                      decimalScale={0}
                    />
                  </Text>
                </Table.Td>
                <Table.Td ta="right">
                  <Text
                    size="sm"
                    fw={500}
                    c={
                      t.type === "sell"
                        ? "red"
                        : t.type === "dividend"
                          ? "blue"
                          : "green"
                    }
                  >
                    <NumberFormatter
                      value={
                        t.price * t.shares + (t.type === "buy" ? t.fee : -t.fee)
                      }
                      thousandSeparator=","
                      decimalScale={0}
                    />
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed" lineClamp={1}>
                    {t.notes || "—"}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Group gap={4} wrap="nowrap">
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      onClick={() => onEdit(t)}
                      aria-label={`Edit transaction ${t.id}`}
                    >
                      <IconEdit size={14} />
                    </ActionIcon>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="red"
                      onClick={() => onDelete(t)}
                      aria-label={`Delete transaction ${t.id}`}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
