import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@mantine/core",
    "@mantine/hooks",
    "@mantine/form",
    "@mantine/notifications",
    "@mantine/dates",
  ],
  serverExternalPackages: ["googleapis", "google-auth-library"],
  allowedDevOrigins: ["192.168.100.38"],
};

export default nextConfig;
