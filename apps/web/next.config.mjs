/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui", "@repo/db"],
  serverExternalPackages: ["@prisma/client", "prisma"],
}

export default nextConfig
