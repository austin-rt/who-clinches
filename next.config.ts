import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  outputFileTracingExcludes: {
    '*': ['**/__fixtures__/**', '**/lib/msw/**'],
  },
  serverExternalPackages: ['voyageai'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'a.espncdn.com',
        pathname: '/i/teamlogos/**',
      },
    ],
  },
};

export default nextConfig;
