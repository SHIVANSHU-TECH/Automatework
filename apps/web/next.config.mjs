/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Skip type checking and ESLint during `next build`
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // NOTE: Do NOT set Cross-Origin-Opener-Policy here — it blocks
          // Firebase Google OAuth popup (window.closed check fails).
          // Vercel/Next.js sets COOP by default; override it to allow popups:
          { key: 'Cross-Origin-Opener-Policy', value: 'unsafe-none' },
        ],
      },
    ];
  },
};

export default nextConfig;
