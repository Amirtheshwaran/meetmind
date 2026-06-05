import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow Supabase image domains if needed
  images: {
    remotePatterns: [],
  },
  // Increase body size limit for API routes (audio metadata)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
