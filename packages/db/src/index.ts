import path from "path";
// import dotenv from "dotenv";
import dotenv from "dotenv"
dotenv.config()
// Load .env explicitly before importing/constructing Prisma
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Debug — remove after confirming it works
console.debug("packages/db: cwd=", process.cwd());
console.debug("packages/db: DATABASE_URL present=", !!process.env.DATABASE_URL);

// Now import the generated client and create the singleton
import { PrismaClient } from "./generated/client.js";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prismaClient =
  globalForPrisma.prisma ?? (globalForPrisma.prisma = new PrismaClient());