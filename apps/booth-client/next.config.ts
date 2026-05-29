import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '4000' },
      { protocol: 'http', hostname: '192.168.**' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/:path*`,
      },
    ];
  },
  webpack(config) {
    // Konva's Node.js entry tries to require('canvas') — stub it for the browser bundle.
    // Use require.resolve to find konva dynamically regardless of machine or pnpm path.
    let konvaBrowserPath: string;
    try {
      // Resolve the konva package root, then point to browser UMD build
      const konvaPkg = require.resolve('konva/package.json');
      konvaBrowserPath = path.join(path.dirname(konvaPkg), 'konva.js');
    } catch {
      konvaBrowserPath = 'konva/konva.js';
    }

    config.resolve.alias = {
      ...config.resolve.alias,
      'konva/lib/index-node.js': konvaBrowserPath,
      canvas: false,
    };
    return config;
  },
};

export default nextConfig;
