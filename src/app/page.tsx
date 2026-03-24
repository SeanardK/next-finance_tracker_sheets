"use client";

import { useUser } from "@clerk/nextjs";
import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconArrowRight,
  IconBrandGoogle,
  IconChartBar,
  IconChartPie,
  IconCoin,
  IconFileSpreadsheet,
  IconLock,
  IconRefresh,
  IconWallet,
} from "@tabler/icons-react";
import Link from "next/link";

const FEATURES = [
  {
    icon: IconFileSpreadsheet,
    title: "Your own Google Sheet",
    description:
      "Connect any Google Spreadsheet you own. Your data lives in your Drive — not our servers.",
  },
  {
    icon: IconChartPie,
    title: "Spending breakdown",
    description:
      "Visual category charts show exactly where your money goes each month.",
  },
  {
    icon: IconChartBar,
    title: "Monthly trends",
    description:
      "Bar charts compare income vs. expenses across months so you spot patterns fast.",
  },
  {
    icon: IconWallet,
    title: "Multiple accounts",
    description:
      "Track checking, savings, credit, and cash accounts all in one place.",
  },
  {
    icon: IconRefresh,
    title: "Import & export",
    description:
      "Bulk-import transactions from CSV or export a full backup any time.",
  },
  {
    icon: IconLock,
    title: "Private & secure",
    description:
      "Sign in with Google via Clerk. Credentials are encrypted in your private metadata.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Sign in with Google",
    description: "One click with your Gmail account — no password needed.",
  },
  {
    number: "02",
    title: "Connect your spreadsheet",
    description:
      "Paste your Google Spreadsheet ID and service account key in Settings.",
  },
  {
    number: "03",
    title: "Start tracking",
    description:
      "Add transactions, create categories, and watch your dashboard come alive.",
  },
];

export default function HomePage() {
  const { isSignedIn } = useUser();

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <Container size="lg">
          <Group justify="space-between" py="sm" wrap="nowrap">
            <Group gap="xs">
              <ThemeIcon
                variant="gradient"
                gradient={{ from: "indigo", to: "blue" }}
                size="md"
                radius="md"
              >
                <IconCoin size={16} />
              </ThemeIcon>
              <Text fw={800} size="lg" c="indigo">
                Finance Tracker
              </Text>
            </Group>
            <Group gap="sm">
              {isSignedIn ? (
                <Button
                  component={Link}
                  href="/dashboard"
                  size="sm"
                  radius="xl"
                  variant="gradient"
                  gradient={{ from: "indigo", to: "blue" }}
                  rightSection={<IconArrowRight size={14} />}
                >
                  Go to app
                </Button>
              ) : (
                <>
                  <Button
                    component={Link}
                    href="/sign-in"
                    size="sm"
                    radius="xl"
                    variant="default"
                    visibleFrom="xs"
                  >
                    Sign in
                  </Button>
                  <Button
                    component={Link}
                    href="/sign-up"
                    size="sm"
                    radius="xl"
                    variant="gradient"
                    gradient={{ from: "indigo", to: "blue" }}
                  >
                    Get started
                  </Button>
                </>
              )}
            </Group>
          </Group>
        </Container>
      </header>

      <main className="flex flex-col flex-1">
        {/* Hero */}
        <section className="py-20 sm:py-32 border-b border-gray-100 bg-white">
          <Container size="lg">
            <div className="flex flex-col-reverse md:flex-row items-center gap-12 md:gap-20">
              {/* Text */}
              <div className="flex-1 w-full text-center md:text-left">
                <Badge
                  variant="light"
                  color="indigo"
                  size="lg"
                  radius="xl"
                  mb="md"
                >
                  Personal finance backed by Google Sheets
                </Badge>
                <Title
                  order={1}
                  mb="md"
                  className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight text-gray-900"
                >
                  Track your money,{" "}
                  <span className="text-indigo-600">own your data</span>
                </Title>
                <Text
                  size="lg"
                  c="dimmed"
                  maw={520}
                  mb="xl"
                  lh={1.7}
                  mx={{ base: "auto", md: 0 }}
                >
                  A multi-account finance tracker where every transaction is
                  stored in{" "}
                  <Text component="span" fw={600} c="indigo" inherit>
                    your own Google Spreadsheet
                  </Text>
                  . No lock-in. No subscription.
                </Text>
                <Group gap="md">
                  <Button
                    component={Link}
                    href="/sign-up"
                    size="lg"
                    radius="xl"
                    variant="gradient"
                    gradient={{ from: "indigo", to: "blue" }}
                    rightSection={<IconArrowRight size={16} />}
                    leftSection={<IconBrandGoogle size={18} />}
                  >
                    Sign up with Google
                  </Button>
                  <Button
                    component={Link}
                    href="/sign-in"
                    size="lg"
                    radius="xl"
                    variant="default"
                  >
                    Sign in
                  </Button>
                </Group>
                <Text size="xs" c="dimmed" mt="md">
                  Free forever &middot; Your data stays in your Google Drive
                </Text>
              </div>

              {/* Illustration */}
              <div className="flex-1 w-full max-w-sm md:max-w-none mx-auto">
                <svg
                  viewBox="0 0 440 320"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-auto"
                  aria-hidden="true"
                >
                  {/* Card background */}
                  <rect
                    x="20"
                    y="20"
                    width="400"
                    height="280"
                    rx="24"
                    fill="#EEF2FF"
                  />
                  {/* Top bar */}
                  <rect
                    x="40"
                    y="44"
                    width="180"
                    height="20"
                    rx="6"
                    fill="#C7D2FE"
                  />
                  <rect
                    x="340"
                    y="44"
                    width="60"
                    height="20"
                    rx="6"
                    fill="#818CF8"
                  />
                  {/* Income bar */}
                  <rect
                    x="40"
                    y="86"
                    width="240"
                    height="28"
                    rx="8"
                    fill="#6366F1"
                  />
                  <rect
                    x="40"
                    y="86"
                    width="60"
                    height="28"
                    rx="8"
                    fill="#4338CA"
                  />
                  <text
                    x="50"
                    y="105"
                    fontSize="11"
                    fill="white"
                    fontFamily="sans-serif"
                  >
                    Income
                  </text>
                  <text
                    x="290"
                    y="105"
                    fontSize="11"
                    fill="#4338CA"
                    fontFamily="sans-serif"
                    fontWeight="bold"
                  >
                    $4,200
                  </text>
                  {/* Expense bar */}
                  <rect
                    x="40"
                    y="130"
                    width="160"
                    height="28"
                    rx="8"
                    fill="#A5B4FC"
                  />
                  <rect
                    x="40"
                    y="130"
                    width="40"
                    height="28"
                    rx="8"
                    fill="#6366F1"
                  />
                  <text
                    x="50"
                    y="149"
                    fontSize="11"
                    fill="white"
                    fontFamily="sans-serif"
                  >
                    Expenses
                  </text>
                  <text
                    x="210"
                    y="149"
                    fontSize="11"
                    fill="#4338CA"
                    fontFamily="sans-serif"
                    fontWeight="bold"
                  >
                    $2,840
                  </text>
                  {/* Net bar */}
                  <rect
                    x="40"
                    y="174"
                    width="100"
                    height="28"
                    rx="8"
                    fill="#C7D2FE"
                  />
                  <text
                    x="50"
                    y="193"
                    fontSize="11"
                    fill="#4338CA"
                    fontFamily="sans-serif"
                  >
                    Net
                  </text>
                  <text
                    x="150"
                    y="193"
                    fontSize="11"
                    fill="#16A34A"
                    fontFamily="sans-serif"
                    fontWeight="bold"
                  >
                    +$1,360
                  </text>
                  {/* Mini pie */}
                  <circle cx="340" cy="210" r="52" fill="#C7D2FE" />
                  <path
                    d="M340 210 L340 158 A52 52 0 0 1 392 210 Z"
                    fill="#6366F1"
                  />
                  <path
                    d="M340 210 L392 210 A52 52 0 0 1 314 259 Z"
                    fill="#818CF8"
                  />
                  <path
                    d="M340 210 L314 259 A52 52 0 0 1 288 210 Z"
                    fill="#A5B4FC"
                  />
                  {/* Divider */}
                  <line
                    x1="40"
                    y1="236"
                    x2="260"
                    y2="236"
                    stroke="#C7D2FE"
                    strokeWidth="1"
                  />
                  {/* Row items */}
                  <rect
                    x="40"
                    y="248"
                    width="80"
                    height="12"
                    rx="4"
                    fill="#C7D2FE"
                  />
                  <rect
                    x="140"
                    y="248"
                    width="60"
                    height="12"
                    rx="4"
                    fill="#DDE1FA"
                  />
                  <rect
                    x="40"
                    y="270"
                    width="100"
                    height="12"
                    rx="4"
                    fill="#DDE1FA"
                  />
                  <rect
                    x="160"
                    y="270"
                    width="40"
                    height="12"
                    rx="4"
                    fill="#C7D2FE"
                  />
                </svg>
              </div>
            </div>
          </Container>
        </section>

        {/* Features */}
        <section className="py-24 bg-gray-50">
          <Container size="lg">
            <Stack align="center" mb="xl" gap="xs">
              <Title order={2} ta="center" fw={700}>
                Everything you need to stay on top of your finances
              </Title>
              <Text c="dimmed" ta="center" maw={480}>
                Simple, all talking to a spreadsheet you already own.
              </Text>
            </Stack>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg" mt="xl">
              {FEATURES.map((f) => (
                <Card key={f.title} withBorder p="xl" radius="lg" bg="white">
                  <ThemeIcon
                    variant="light"
                    color="indigo"
                    size="xl"
                    radius="md"
                    mb="md"
                  >
                    <f.icon size={22} />
                  </ThemeIcon>
                  <Text fw={700} mb={6}>
                    {f.title}
                  </Text>
                  <Text size="sm" c="dimmed" lh={1.7}>
                    {f.description}
                  </Text>
                </Card>
              ))}
            </SimpleGrid>
          </Container>
        </section>

        {/* How it works */}
        <section className="py-24 bg-white border-y border-gray-100">
          <Container size="lg">
            <Stack align="center" mb="xl" gap="xs">
              <Title order={2} ta="center" fw={700}>
                Up and running in minutes
              </Title>
              <Text c="dimmed" ta="center" maw={480}>
                No complex setup — just three steps.
              </Text>
            </Stack>
            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl" mt="xl">
              {STEPS.map((step) => (
                <div
                  key={step.number}
                  className="flex flex-col items-center text-center"
                >
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-indigo-600 text-white text-2xl font-extrabold mb-4 shadow-md">
                    {step.number}
                  </div>
                  <Text fw={700} size="lg" mb={4}>
                    {step.title}
                  </Text>
                  <Text c="dimmed" size="sm" lh={1.7} maw={240}>
                    {step.description}
                  </Text>
                </div>
              ))}
            </SimpleGrid>
          </Container>
        </section>

        {/* CTA */}
        <section className="py-24 bg-indigo-600">
          <Container size="sm">
            <Stack align="center" gap="xl" ta="center">
              <Title order={2} c="white" maw={480}>
                Ready to take control of your finances?
              </Title>
              <Text c="indigo.2" size="lg" maw={400} lh={1.7}>
                Free to use. Your data always stays in your Google Drive.
              </Text>
              <Group gap="md" justify="center">
                <Button
                  component={Link}
                  href="/sign-up"
                  size="lg"
                  radius="xl"
                  color="white"
                  c="indigo.8"
                  leftSection={<IconBrandGoogle size={18} />}
                  rightSection={<IconArrowRight size={16} />}
                >
                  Get started for free
                </Button>
                <Button
                  component={Link}
                  href="/sign-in"
                  size="lg"
                  radius="xl"
                  variant="outline"
                  color="white"
                >
                  Sign in
                </Button>
              </Group>
            </Stack>
          </Container>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-8">
        <Container size="lg">
          <Group justify="space-between" wrap="wrap" gap="sm">
            <Group gap="xs">
              <ThemeIcon
                variant="gradient"
                gradient={{ from: "indigo", to: "blue" }}
                size="sm"
                radius="md"
              >
                <IconCoin size={12} />
              </ThemeIcon>
              <Text size="sm" c="dimmed" fw={600}>
                Finance Tracker
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              © {new Date().getFullYear()} Finance Tracker. Built with Next.js
              &amp; Google Sheets.
            </Text>
          </Group>
        </Container>
      </footer>
    </div>
  );
}
