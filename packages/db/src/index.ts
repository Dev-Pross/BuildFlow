import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Debug — remove after confirming it works
console.debug("packages/db: cwd=", process.cwd());
console.debug("packages/db: DATABASE_URL present=", !!process.env.DATABASE_URL);

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prismaClient =
  globalForPrisma.prisma ?? (globalForPrisma.prisma = new PrismaClient({}));
