import { PrismaClient } from "./generated/prisma";

// Using a global singleton is a common pattern with Prisma in server environments
// (such as with Next.js or hot-reloading setups) to avoid creating multiple instances
// of PrismaClient, which can lead to problems like exhausting your database connection pool.
// By attaching the PrismaClient instance to a global object, we make sure that only one instance
// exists across reloads or re-imports.

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prismaClient =
  globalForPrisma.prisma ?? (globalForPrisma.prisma = new PrismaClient());

// No further global assignment/check needed, assignment is inside the ?? operator above.
