import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Absolute project root (next.config lives here). Fixes Turbopack picking a parent folder when multiple lockfiles exist. */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "serialport",
    "@serialport/bindings-cpp",
    "@serialport/parser-readline",
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.dev',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ignore optional resend module during build
      config.externals = config.externals || [];
      config.externals.push('resend');
    }
    return config;
  },
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
