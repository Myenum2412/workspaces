import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pub-819cf41d8e124578a1663118cf94cf98.r2.dev',
        pathname: '/**',
      },
    ],
  },
  turbopack: {},

  // Cloudflare Pages deployment
  // Build command: next build
  // Then: npx @cloudflare/next-on-pages@1 --skip-build
  output: "standalone",
};

export default nextConfig;
