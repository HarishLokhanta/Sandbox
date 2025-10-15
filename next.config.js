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
};

module.exports = nextConfig;
