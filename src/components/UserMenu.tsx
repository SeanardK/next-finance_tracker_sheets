"use client";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { Button, Menu, Text, Tooltip } from "@mantine/core";
import { IconLogout, IconUser } from "@tabler/icons-react";
import Link from "next/link";

export function UserMenu() {
  const { user, isSignedIn } = useUser();

  if (!isSignedIn)
    return (
      <Button
        variant="outline"
        radius={"lg"}
        component={Link}
        href="/create"
        size="sm"
      >
        Sign In
      </Button>
    );

  return (
    <Menu shadow="md" width={200} position="bottom-end">
      <Menu.Target>
        <Button variant="subtle" leftSection={<IconUser size={16} />}>
          {user?.firstName || user?.username || "Account"}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Tooltip
          position="left"
          label={user?.emailAddresses?.[0]?.emailAddress}
          withArrow
        >
          <Menu.Item leftSection={<IconUser size={16} />}>
            <Text truncate="end" className="max-w-35">
              {user?.emailAddresses?.[0]?.emailAddress}
            </Text>
          </Menu.Item>
        </Tooltip>
        <Menu.Divider />
        <Menu.Item color="red" leftSection={<IconLogout size={16} />}>
          <SignOutButton>Logout</SignOutButton>
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
