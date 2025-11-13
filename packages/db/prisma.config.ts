import { defineConfig, env } from "prisma/config";
import 'dotenv/config';

// Load .env when present so env("DATABASE_URL") in schema.prisma resolves
// while using a custom Prisma config file.
// try { require('dotenv/config'); } catch {}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
