/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma"],
  transpilePackages: ["@workspace/ui", "@repo/db", "@repo/common"],

}

export default nextConfig
