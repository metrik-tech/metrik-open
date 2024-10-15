import million from "million/compiler";
import { withAxiom } from "next-axiom";

/** @type {import('next/types').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@heroicons/react",
      "@headlessui/react",
      "@tremor/react",
    ],
  },
  transpilePackages: [
    "@metrik/db",
    "@metrik/jwt",
    "@metrik/api",
    "@metrik/stripe-constants",
    "@metrik/stripe",
  ],
  swcMinify: true,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.rbxcdn.com",
      },
      {
        protocol: "https",
        hostname: "thumbs.metrik.app",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
    ],
  },
  headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
export default (!process.env.VERCEL ? (input) => input : million.next)(
  withAxiom(nextConfig),
  {
    auto: { rsc: true },
  },
);
