import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Cache optimized images for 60 days
    minimumCacheTTL: 60 * 60 * 24 * 60,

    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bhfrgcphqmbocplfcvbg.supabase.co',
        port: '',
        // FIX: Changed from '/storage/v1/object/public/**' to '/storage/v1/**'
        // This allows BOTH /object/ (raw) and /render/ (optimized)
        pathname: '/storage/v1/**', 
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
      },
    ],
  },
  skipTrailingSlashRedirect: true, 
};

export default nextConfig;