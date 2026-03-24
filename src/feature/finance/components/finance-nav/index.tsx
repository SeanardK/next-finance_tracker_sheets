"use client";

import { NavLink, Stack } from "@mantine/core";
import {
  IconCategory,
  IconChartBar,
  IconList,
  // IconBuildingBank,
  IconSettings,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: IconChartBar },
  { href: "/transactions", label: "Transactions", icon: IconList },
  { href: "/categories", label: "Categories", icon: IconCategory },
  // { href: "/accounts", label: "Accounts", icon: IconBuildingBank },
  { href: "/settings", label: "Settings", icon: IconSettings },
];

interface Props {
  onNavClick?: () => void;
}

export function FinanceNav({ onNavClick }: Props) {
  const pathname = usePathname();

  return (
    <Stack gap={4}>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <NavLink
          key={href}
          component={Link}
          href={href}
          label={label}
          leftSection={<Icon size={16} />}
          active={pathname === href}
          aria-label={label}
          onClick={onNavClick}
        />
      ))}
    </Stack>
  );
}
