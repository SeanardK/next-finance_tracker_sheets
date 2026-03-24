# Finance Tracker


A personal finance tracking web application powered by **Next.js** and **Google Sheets**. Each user connects their own Google Spreadsheet as a private backend. your financial data stays in your Google Drive, never on a shared server.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Google Sheets Setup](#google-sheets-setup)
- [Available Scripts](#available-scripts)
- [Docker](#docker)
- [Project Structure](#project-structure)
- [License](#license)

---


## Features

- **Google Sheets as your database** : connect any spreadsheet you own; data is read/written via the Google Sheets API using your own service account
- **Dashboard** : monthly income vs. expense summary with at-a-glance balance cards
- **Spending breakdown** : pie/donut chart grouped by category per month
- **Monthly trends** : bar chart comparing income and expenses across the last 6 months
- **Transactions** : full CRUD with date, amount, account, category, and notes
- **Accounts** : manage multiple accounts (checking, savings, credit, cash, etc.)
- **Categories** : custom income and expense categories
- **Import / Export** : bulk-import transactions from CSV or download a full backup at any time
- **Authentication** : Google sign-in via [Clerk](https://clerk.com); credentials are encrypted in private user metadata
- **PWA-ready** : service worker and web app manifest included

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | Mantine 7, Tailwind CSS 4, Tabler Icons |
| Charts | Apache ECharts (echarts-for-react) |
| Data fetching | TanStack Query v5 |
| Auth | Clerk |
| Storage | Google Sheets API v4 (`googleapis`) |
| Language | TypeScript 5 |
| Linting / Formatting | Biome |
| Runtime | Node.js 20 |
| Package manager | pnpm |
| Containerisation | Docker |

---

## Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9
- A [Clerk](https://clerk.com) application with Google OAuth enabled
- A Google Cloud project with the **Google Sheets API** enabled and a **Service Account** JSON key

---

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd finance
pnpm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_…
CLERK_SECRET_KEY=sk_…

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

> Google Sheets credentials (spreadsheet ID and service account key) are stored per-user via the **Settings** page in the app. They do not go in `.env`.

### 3. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Google Sheets Setup

1. Create a new Google Spreadsheet at [sheets.google.com](https://sheets.google.com) and note the **Spreadsheet ID** from its URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```
2. In [Google Cloud Console](https://console.cloud.google.com):
   - Create a project (or use an existing one)
   - Enable the **Google Sheets API**
   - Create a **Service Account** and download its JSON key
3. Share your spreadsheet with the service account's `client_email` (from the JSON key) and grant **Editor** access
4. Sign in to the app, navigate to **Settings**, and paste your Spreadsheet ID and the full JSON key → **Save Settings**
5. Click **Test & Initialise Sheets** to provision the required sheets automatically

---

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the development server |
| `pnpm build` | Create a production build |
| `pnpm start` | Start the production server |
| `pnpm lint` | Check code with Biome |
| `pnpm lint:fix` | Auto-fix lint issues |
| `pnpm format` | Format all files with Biome |

---

## Docker

### Build and run with Docker Compose

```bash
# Copy and fill in your environment variables
cp .env.example .env

docker compose up -d --build
```

The app will be available on the port defined by `DOCKER_PORT` in your `.env` (defaults to `3000`).

### Build manually

```bash
docker build -t finance-tracker .
docker run -p 3000:3000 --env-file .env finance-tracker
```

---

## Project Structure

```
src/
├── app/
│   ├── (finance)/          # Authenticated app shell & pages
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   ├── accounts/
│   │   ├── categories/
│   │   └── settings/
│   └── api/finance/        # REST API routes (Next.js Route Handlers)
│       ├── accounts/
│       ├── categories/
│       ├── transactions/
│       ├── import-export/
│       ├── provision/
│       ├── settings/
│       └── summary/
├── feature/finance/
│   ├── components/         # Page-level UI components
│   ├── hooks/              # TanStack Query hooks
│   ├── lib/                # Google Sheets client & helpers
│   └── types/
└── provider/               # Global React providers
```

---
