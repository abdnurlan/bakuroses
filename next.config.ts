import type { NextConfig } from 'next';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3002';

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.fal.media' },
      { protocol: 'https', hostname: '**.fal.run' },
      { protocol: 'https', hostname: 'fal.media' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  experimental: {
    scrollRestoration: false,
  },
  async rewrites() {
    return [
      {
        source: '/api/zones/:path*',
        destination: `${BACKEND_URL}/api/zones/:path*`,
      },
      {
        source: '/api/orders/:path*',
        destination: `${BACKEND_URL}/api/orders/:path*`,
      },
      {
        source: '/api/payments/:path*',
        destination: `${BACKEND_URL}/api/payments/:path*`,
      },
      {
        source: '/api/deliveries/:path*',
        destination: `${BACKEND_URL}/api/deliveries/:path*`,
      },
      {
        source: '/api/products/:path*',
        destination: `${BACKEND_URL}/api/products/:path*`,
      },
      {
        source: '/api/admin/:path*',
        destination: `${BACKEND_URL}/api/admin/:path*`,
      },
      {
        source: '/health',
        destination: `${BACKEND_URL}/health`,
      },
    ];
  },
};

export default nextConfig;
