import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Standard Next.js config - TypeScript checking handled by npm script
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
