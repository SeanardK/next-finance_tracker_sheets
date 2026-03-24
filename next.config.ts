import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@mantine/core",
    "@mantine/hooks",
    "@mantine/form",
    "@mantine/notifications",
    "@mantine/dates",
  ],
  // Prevent googleapis and its heavy deps from being bundled in the client
  serverExternalPackages: ["googleapis", "google-auth-library"],
};

export default nextConfig;
