import { withAxiom } from "next-axiom";

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
};

export default withAxiom(nextConfig);
