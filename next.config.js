/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['www.microburbs.com.au'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.microburbs.com.au',
      },
    ],
  },

  // Enhanced webpack config for stable chunks and better HMR
  webpack: (config, { dev, isServer }) => {
    // In development, ensure stable chunk IDs
    if (dev && !isServer) {
      // Use deterministic chunk IDs instead of natural (prevents missing chunk errors)
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
      };

      // Disable caching in dev to prevent stale chunks
      config.cache = false;
    }

    return config;
  },

  // Disable SWC minifier's cache in dev (can cause HMR issues)
  experimental: {
    // Ensure proper module resolution
    ...(process.env.NODE_ENV === 'development' && {
      swcMinify: false,
    }),
  },
};

module.exports = nextConfig;
