"use client";

import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  ColorInput,
  Divider,
  Group,
  Modal,
  Paper,
  Progress,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconBuildingBank,
  IconEdit,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";
import {
  useAccountBalances,
  useAccounts,
  useCreateAccount,
  useDeleteAccount,
  useUpdateAccount,
} from "@/feature/finance/hooks/use-accounts";
import type { Account, AccountType } from "@/feature/finance/types";

interface AccountForm {
  name: string;
  type: AccountType;
  color: string;
}

const ACCOUNT_TYPE_OPTIONS = [
  { value: "bank", label: "Bank" },
  { value: "cash", label: "Cash" },
  { value: "e-wallet", label: "E-Wallet" },
  { value: "investment", label: "Investment" },
  { value: "credit", label: "Credit" },
];

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

function formatAmount(n: number, currency: string) {
  return `${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${currency}`;
}

const MONTH_OPTIONS = getMonthOptions();

const typeColor: Record<AccountType, string> = {
  bank: "blue",
  cash: "green",
  "e-wallet": "violet",
  investment: "orange",
  credit: "red",
};

export default function AccountsPage() {
  const { data, isLoading, error } = useAccounts();
  const createAcct = useCreateAccount();
  const updateAcct = useUpdateAccount();
  const deleteAcct = useDeleteAccount();

  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const { data: balanceData, isLoading: balanceLoading } =
    useAccountBalances(month);
  const balances = useMemo(() => balanceData?.balances ?? [], [balanceData]);

  const [modalOpen, { open, close }] = useDisclosure(false);
  const [editTarget, setEditTarget] = useState<Account | null>(null);

  const form = useForm<AccountForm>({
    initialValues: { name: "", type: "bank", color: "#868e96" },
    validate: { name: (v) => (!v.trim() ? "Name required" : null) },
  });

  function handleEdit(acct: Account) {
    setEditTarget(acct);
    form.setValues({ name: acct.name, type: acct.type, color: acct.color });
    open();
  }

  function handleDelete(acct: Account) {
    modals.openConfirmModal({
      title: "Delete account",
      children: `Delete "${acct.name}"?`,
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await deleteAcct.mutateAsync(acct.rowIndex);
          notifications.show({ color: "green", message: "Account deleted" });
        } catch (err) {
          notifications.show({ color: "red", message: (err as Error).message });
        }
      },
    });
  }

  async function handleSubmit(values: AccountForm) {
    try {
      if (editTarget) {
        await updateAcct.mutateAsync({
          rowId: editTarget.rowIndex,
          data: { ...editTarget, ...values },
        });
        notifications.show({ color: "green", message: "Account updated" });
      } else {
        await createAcct.mutateAsync(values);
        notifications.show({ color: "green", message: "Account created" });
      }
      form.reset();
      setEditTarget(null);
      close();
    } catch (err) {
      notifications.show({ color: "red", message: (err as Error).message });
    }
  }

  const accounts = data?.accounts ?? [];

  return (
    <>
      <Modal
        opened={modalOpen}
        onClose={() => {
          close();
          setEditTarget(null);
          form.reset();
        }}
        title={editTarget ? "Edit Account" : "Add Account"}
        aria-label="Account form"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <TextInput
              label="Name"
              required
              placeholder="e.g. BCA, Cash, GoPay"
              aria-label="Account name"
              {...form.getInputProps("name")}
            />
            <Select
              label="Type"
              data={ACCOUNT_TYPE_OPTIONS}
              aria-label="Account type"
              {...form.getInputProps("type")}
            />
            <ColorInput
              label="Color"
              aria-label="Account color"
              {...form.getInputProps("color")}
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={close} type="button">
                Cancel
              </Button>
              <Button
                type="submit"
                loading={createAcct.isPending || updateAcct.isPending}
              >
                {editTarget ? "Update" : "Create"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Group justify="space-between" mb="md">
        <Title order={2}>Accounts</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          Add Account
        </Button>
      </Group>

      {/* ── Balance Section ── */}
      <Stack gap="md" mb="xl">
        <Group justify="space-between">
          <Text fw={600} size="lg">
            Balance Overview
          </Text>
          <Select
            data={MONTH_OPTIONS}
            value={month}
            onChange={(v) => v && setMonth(v)}
            w={180}
            size="sm"
            aria-label="Select month"
          />
        </Group>

        {balanceLoading ? (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
            {[1, 2, 3].map((k) => (
              <Skeleton key={k} height={140} radius="md" />
            ))}
          </SimpleGrid>
        ) : balances.length === 0 ? (
          <Text c="dimmed" size="sm">
            No balance data — add accounts and transactions to see stats.
          </Text>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
            {balances.map((b) => {
              const pct =
                b.monthBudgeted > 0
                  ? Math.min(100, (b.monthSpent / b.monthBudgeted) * 100)
                  : 0;
              const progressColor =
                pct >= 100 ? "red" : pct >= 80 ? "orange" : "teal";
              const netPositive = b.netBalance >= 0;
              return (
                <Card key={b.account} withBorder radius="md" p="md">
                  <Group gap={6} mb="xs">
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: b.color || "#868e96",
                        flexShrink: 0,
                      }}
                    />
                    <Text fw={600} size="sm" truncate>
                      {b.account}
                    </Text>
                  </Group>

                  <Text
                    size="xl"
                    fw={700}
                    c={netPositive ? "teal" : "red"}
                    mb={4}
                  >
                    {netPositive ? "+" : ""}
                    {formatAmount(b.netBalance, b.currency)}
                  </Text>
                  <Text size="xs" c="dimmed" mb="sm">
                    All-time net balance
                  </Text>

                  <Divider mb="sm" />

                  <Group justify="space-between" mb={4}>
                    <Text size="xs" c="dimmed">
                      Spent this month
                    </Text>
                    <Text size="xs" fw={500}>
                      {formatAmount(b.monthSpent, b.currency)}
                    </Text>
                  </Group>
                  <Group justify="space-between" mb={4}>
                    <Text size="xs" c="dimmed">
                      Budgeted
                    </Text>
                    <Text size="xs" fw={500}>
                      {b.monthBudgeted > 0
                        ? formatAmount(b.monthBudgeted, b.currency)
                        : "—"}
                    </Text>
                  </Group>
                  <Group justify="space-between" mb="xs">
                    <Text size="xs" c="dimmed">
                      Remaining
                    </Text>
                    <Text
                      size="xs"
                      fw={600}
                      c={b.monthRemaining >= 0 ? "teal" : "red"}
                    >
                      {b.monthBudgeted > 0
                        ? formatAmount(b.monthRemaining, b.currency)
                        : "—"}
                    </Text>
                  </Group>
                  {b.monthBudgeted > 0 && (
                    <Progress value={pct} color={progressColor} size="xs" />
                  )}
                </Card>
              );
            })}
          </SimpleGrid>
        )}
      </Stack>

      <Divider mb="lg" label="Manage Accounts" labelPosition="left" />

      {error ? (
        <Alert icon={<IconAlertCircle />} color="orange">
          {(error as Error).message}
        </Alert>
      ) : isLoading ? (
        <Skeleton height={300} />
      ) : (
        <Paper withBorder radius="md">
          <Table.ScrollContainer minWidth={400}>
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Color</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {accounts.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={4}>
                      <Text ta="center" c="dimmed" py="xl">
                        <IconBuildingBank
                          size={32}
                          style={{ display: "block", margin: "0 auto 8px" }}
                        />
                        No accounts yet — add one to get started
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  accounts.map((acct) => (
                    <Table.Tr key={acct.id}>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          {acct.name}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="sm" color={typeColor[acct.type] ?? "gray"}>
                          {acct.type}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={6}>
                          <div
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: 4,
                              background: acct.color,
                              border: "1px solid #dee2e6",
                            }}
                          />
                          <Text size="xs">{acct.color}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          <Tooltip label="Edit">
                            <ActionIcon
                              variant="subtle"
                              size="sm"
                              aria-label="Edit account"
                              onClick={() => handleEdit(acct)}
                            >
                              <IconEdit size={14} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Delete">
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              size="sm"
                              aria-label="Delete account"
                              onClick={() => handleDelete(acct)}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      )}
    </>
  );
}
