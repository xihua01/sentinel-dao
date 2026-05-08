import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_PROJECT_ID: process.env.PROJECT_ID || '',
    NEXT_PUBLIC_ALCHEMY_URL: process.env.ALCHEMY_URL || '',
  },
};

export default nextConfig;
