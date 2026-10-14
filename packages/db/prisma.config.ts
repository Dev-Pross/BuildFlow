import { defineConfig, env } from "prisma/config";
import dotenv from "dotenv";

// Explicitly load environment variables from .env if present
dotenv.config();

// Retrieve DATABASE_URL from environment or fallback placeholder for build-time generation
const databaseUrl = process.env.DATABASE_URL || "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: databaseUrl,
  },
});
