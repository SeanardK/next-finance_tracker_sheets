"use client";

import {
  Alert,
  Anchor,
  Badge,
  Button,
  Code,
  Divider,
  Group,
  List,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useMantineColorScheme } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCheck,
  IconDownload,
  IconKey,
  IconLink,
  IconMoon,
  IconRefresh,
  IconSun,
  IconUpload,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";

export default function SettingsPage() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [serviceAccountKey, setServiceAccountKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [configured, setConfigured] = useState<{
    spreadsheetId: string | null;
    hasServiceAccountKey: boolean;
  } | null>(null);

  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/finance/settings")
      .then((r) => r.json())
      .then((data) => {
        setConfigured(data);
        if (data.spreadsheetId) setSpreadsheetId(data.spreadsheetId);
      })
      .catch(() => {});
  }, []);

  async function handleSaveSettings() {
    if (!spreadsheetId.trim()) {
      notifications.show({
        color: "red",
        message: "Spreadsheet ID is required",
      });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/finance/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spreadsheetId: spreadsheetId.trim(),
          ...(serviceAccountKey.trim()
            ? { serviceAccountKey: serviceAccountKey.trim() }
            : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setConfigured((prev) => ({
        spreadsheetId: spreadsheetId.trim(),
        hasServiceAccountKey: serviceAccountKey.trim()
          ? true
          : (prev?.hasServiceAccountKey ?? false),
      }));
      setServiceAccountKey("");
      notifications.show({
        color: "green",
        icon: <IconCheck size={16} />,
        message: "Settings saved!",
      });
    } catch (err) {
      notifications.show({ color: "red", message: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  async function handleProvision() {
    setProvisioning(true);
    try {
      const res = await fetch("/api/finance/provision", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notifications.show({
        color: "green",
        icon: <IconCheck size={16} />,
        message: "Spreadsheet initialised! All required sheets are ready.",
      });
    } catch (err) {
      notifications.show({ color: "red", message: (err as Error).message });
    } finally {
      setProvisioning(false);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const res = await fetch("/api/finance/import-export", {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: text,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notifications.show({
        color: "green",
        message: `Imported ${data.imported} transactions`,
      });
    } catch (err) {
      notifications.show({ color: "red", message: (err as Error).message });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const isFullyConfigured =
    configured?.spreadsheetId && configured?.hasServiceAccountKey;

  return (
    <>
      <Title order={2} mb="lg">
        Settings
      </Title>

      {/* Appearance */}
      <Paper withBorder p="lg" radius="md" mb="lg">
        <Stack gap="md">
          <Text fw={600} size="lg">
            Appearance
          </Text>
          <Group gap="sm">
            <Text size="sm" c="dimmed" style={{ minWidth: 80 }}>
              Color scheme
            </Text>
            <SegmentedControl
              value={colorScheme}
              onChange={(v) => setColorScheme(v as "light" | "dark" | "auto")}
              data={[
                {
                  value: "light",
                  label: (
                    <Group gap={6} wrap="nowrap">
                      <IconSun size={14} />
                      <span>Light</span>
                    </Group>
                  ),
                },
                {
                  value: "dark",
                  label: (
                    <Group gap={6} wrap="nowrap">
                      <IconMoon size={14} />
                      <span>Dark</span>
                    </Group>
                  ),
                },
              ]}
            />
          </Group>
        </Stack>
      </Paper>

      <Divider mb="lg" />

      {/* Google Sheets Configuration */}
      <Paper withBorder p="lg" radius="md" mb="lg">
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Text fw={600} size="lg">
              Google Sheets Configuration
            </Text>
            {isFullyConfigured ? (
              <Badge color="green" variant="light">
                Configured
              </Badge>
            ) : (
              <Badge color="orange" variant="light">
                Setup required
              </Badge>
            )}
          </Group>

          <Alert
            icon={<IconAlertCircle size={16} />}
            color="blue"
            variant="light"
          >
            Each user connects their own Google Spreadsheet and Service Account.
            Your credentials are stored privately and never shared.
          </Alert>

          {/* Setup guide */}
          <Paper
            withBorder
            p="sm"
            radius="sm"
            bg={colorScheme === "dark" ? "gray.8" : "gray.0"}
          >
            <Text size="sm" fw={500} mb="xs">
              Quick setup guide
            </Text>
            <List size="sm" spacing={4} listStyleType="ordered">
              <List.Item>
                Create a Google Spreadsheet at{" "}
                <Anchor
                  href="https://sheets.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  sheets.google.com
                </Anchor>{" "}
                and copy the ID from the URL
                <br />
                <Code style={{ wordBreak: "break-all" }}>
                  https://docs.google.com/spreadsheets/d/
                  <strong>[SPREADSHEET_ID]</strong>/edit
                </Code>
              </List.Item>
              <List.Item>
                In{" "}
                <Anchor
                  href="https://console.cloud.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google Cloud Console
                </Anchor>
                , create a project → enable <strong>Google Sheets API</strong> →
                create a <strong>Service Account</strong> → download its JSON
                key
              </List.Item>
              <List.Item>
                Share your spreadsheet with the service account email (found in
                the JSON key as <Code>client_email</Code>) and give it{" "}
                <strong>Editor</strong> access
              </List.Item>
              <List.Item>
                Paste the values below and click Save Settings
              </List.Item>
            </List>
          </Paper>

          <TextInput
            label="Spreadsheet ID"
            placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
            description="The ID portion of your Google Sheets URL"
            leftSection={<IconLink size={16} />}
            value={spreadsheetId}
            onChange={(e) => setSpreadsheetId(e.currentTarget.value)}
          />

          <Textarea
            label={
              configured?.hasServiceAccountKey
                ? "Service Account JSON key (leave blank to keep existing)"
                : "Service Account JSON key"
            }
            placeholder={
              '{"type":"service_account","project_id":"...","private_key":"...","client_email":"...@....iam.gserviceaccount.com",...}'
            }
            description="Paste the full contents of your downloaded service account JSON file"
            leftSection={<IconKey size={16} />}
            autosize
            minRows={3}
            maxRows={8}
            value={serviceAccountKey}
            onChange={(e) => setServiceAccountKey(e.currentTarget.value)}
            styles={{ input: { fontFamily: "monospace", fontSize: 12 } }}
          />

          <Group wrap="wrap" gap="xs">
            <Button
              onClick={handleSaveSettings}
              loading={saving}
              leftSection={<IconCheck size={16} />}
            >
              Save Settings
            </Button>

            {isFullyConfigured && (
              <Button
                variant="default"
                onClick={handleProvision}
                loading={provisioning}
                leftSection={<IconRefresh size={16} />}
              >
                Test & Initialise Sheets
              </Button>
            )}
          </Group>

          {configured?.spreadsheetId && (
            <Text size="sm" c="dimmed" style={{ wordBreak: "break-all" }}>
              Current spreadsheet:{" "}
              <Anchor
                href={`https://docs.google.com/spreadsheets/d/${configured.spreadsheetId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {configured.spreadsheetId}
              </Anchor>
            </Text>
          )}
        </Stack>
      </Paper>

      <Divider mb="lg" />

      {/* Export / Import */}
      <Paper withBorder p="lg" radius="md">
        <Stack gap="sm">
          <Text fw={600} size="lg">
            Backup &amp; Restore
          </Text>
          <Text size="sm" c="dimmed">
            Export all transactions as a CSV file, or import from a previous
            backup.
          </Text>

          <Group wrap="wrap" gap="xs">
            <Button
              variant="default"
              leftSection={<IconDownload size={16} />}
              component="a"
              href="/api/finance/import-export"
            >
              Export CSV
            </Button>

            <Button
              variant="default"
              leftSection={<IconUpload size={16} />}
              loading={importing}
              onClick={() => fileRef.current?.click()}
            >
              Import CSV
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              style={{ display: "none" }}
              onChange={handleImport}
              aria-label="Import CSV file"
            />
          </Group>
        </Stack>
      </Paper>
    </>
  );
}
