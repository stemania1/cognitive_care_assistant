import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'images.unsplash.com',
      'plus.unsplash.com',
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
};

export default nextConfig;
