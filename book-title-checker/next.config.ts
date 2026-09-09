import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Browsers probe /favicon.ico regardless of <link rel="icon">. The icon
    // is generated at build time at /icon, so point the probe there.
    return [{ source: "/favicon.ico", destination: "/icon" }];
  },
};

export default nextConfig;
