"use client";

import { ActionIcon, Badge, Group, Table, Text, Tooltip } from "@mantine/core";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import type { Transaction } from "../../types";

interface Props {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}

const typeColor = {
  income: "green",
  expense: "red",
  transfer: "blue",
} as const;

export function TransactionTable({ transactions, onEdit, onDelete }: Props) {
  const rows = transactions.map((tx) => (
    <Table.Tr key={`${tx.rowIndex}-${tx.externalId}`}>
      <Table.Td>
        <Text size="sm">{tx.date}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{tx.account || "—"}</Text>
      </Table.Td>
      <Table.Td>
        <Badge color={typeColor[tx.type] ?? "gray"} size="sm">
          {tx.type}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text size="sm">
          {tx.type === "transfer" && tx.category
            ? `→ ${tx.category}`
            : tx.category || "—"}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text
          size="sm"
          fw={600}
          c={
            tx.type === "income"
              ? "green"
              : tx.type === "expense"
                ? "red"
                : "blue"
          }
        >
          {tx.type === "expense" ? "-" : ""}
          {tx.amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}{" "}
          {tx.currency}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed" truncate lineClamp={1} maw={200}>
          {tx.description || "—"}
        </Text>
      </Table.Td>
      <Table.Td>
        <Group gap={4}>
          <Tooltip label="Edit">
            <ActionIcon
              variant="subtle"
              size="sm"
              aria-label="Edit transaction"
              onClick={() => onEdit(tx)}
            >
              <IconEdit size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete">
            <ActionIcon
              variant="subtle"
              color="red"
              size="sm"
              aria-label="Delete transaction"
              onClick={() => onDelete(tx)}
            >
              <IconTrash size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Table.ScrollContainer minWidth={680}>
      <Table striped highlightOnHover withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Date</Table.Th>
            <Table.Th>Account</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Category</Table.Th>
            <Table.Th>Amount</Table.Th>
            <Table.Th>Description</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.length > 0 ? (
            rows
          ) : (
            <Table.Tr>
              <Table.Td colSpan={7}>
                <Text ta="center" c="dimmed" py="xl">
                  No transactions yet
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
