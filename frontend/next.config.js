/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // middleware(edge runtime)读不到 NEXT_PUBLIC_*,用 next.config env 构建时内联
    API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:8080/uploads/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
