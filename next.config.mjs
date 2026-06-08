/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: [
    "@prisma/client",
    "bcryptjs",
    "mammoth",
    "exceljs",
    "@anthropic-ai/sdk",
  ],
};

export default nextConfig;
