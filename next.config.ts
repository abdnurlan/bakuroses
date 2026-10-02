import type { NextConfig } from 'next';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3002';

const nextConfig: NextConfig = {
  // Docker builds emit .next/standalone so the runtime image needs no node_modules.
  // Left off elsewhere: the server runs `next start`, which Next refuses to pair
  // with standalone output.
  output: process.env.NEXT_OUTPUT_STANDALONE === '1' ? 'standalone' : undefined,
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
  poweredByHeader: false,
  experimental: {
    scrollRestoration: false,
    // not in Next's default list: import only the icons actually used
    optimizePackageImports: ['@phosphor-icons/react'],
  },
  async headers() {
    return [
      {
        // Hero frames are requested as ?v=HERO_FRAMES_VERSION (heroFrameConfig.ts) — bump it when they change
        source: '/hero-frames/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
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
        source: '/uploads/:path*',
        destination: `${BACKEND_URL}/uploads/:path*`,
      },
      {
        source: '/api/categories/:path*',
        destination: `${BACKEND_URL}/api/categories/:path*`,
      },
      {
        source: '/api/admin/:path*',
        destination: `${BACKEND_URL}/api/admin/:path*`,
      },
      {
        source: '/api/promo-codes/:path*',
        destination: `${BACKEND_URL}/api/promo-codes/:path*`,
      },
      {
        source: '/health',
        destination: `${BACKEND_URL}/health`,
      },
    ];
  },
};

export default nextConfig;
