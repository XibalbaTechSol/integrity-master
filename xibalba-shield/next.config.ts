import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/shield',
  images: {
    unoptimized: true,
  }
};

export default nextConfig;
