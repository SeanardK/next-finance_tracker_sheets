"use client";

import {
  AppShell,
  AppShellHeader,
  AppShellMain,
  AppShellNavbar,
  Box,
  Burger,
  Group,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { UserMenu } from "@/components/UserMenu";
import { FinanceNav } from "@/feature/finance/components/finance-nav";

export function FinanceShell({ children }: { children: React.ReactNode }) {
  const [opened, { toggle, close }] = useDisclosure(false);

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{
        width: 220,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
    >
      <AppShellHeader>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="xs">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
              aria-label="Toggle navigation"
            />
            <Text fw={600} size="sm" c="dimmed">
              Finance Tracker
            </Text>
          </Group>
          <Box hiddenFrom="sm">
            <UserMenu />
          </Box>
        </Group>
      </AppShellHeader>

      <AppShellNavbar
        p="xs"
        className="border-r border-gray-200 dark:border-gray-700"
      >
        <FinanceNav onNavClick={close} />
        <Box visibleFrom="sm" className="mt-auto pt-4">
          <UserMenu />
        </Box>
      </AppShellNavbar>

      <AppShellMain>
        <div className="p-4 md:p-6 max-w-7xl mx-auto">{children}</div>
      </AppShellMain>
    </AppShell>
  );
}
