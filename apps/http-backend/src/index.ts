import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load .env file FIRST, before any other imports
// This ensures our environment variables override any from other packages
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, "../.env");
dotenv.config({ path: envPath, override: true });
console.log("📁 Loaded .env from:", envPath);
console.log("🔐 GOOGLE_REDIRECT_URI:", process.env.GOOGLE_REDIRECT_URI || "NOT SET");

import cookieParser from 'cookie-parser'
import { ExecutionRegister, NodeRegistry } from "@repo/nodes/nodeClient";
import express from "express";
import { userRouter } from "./routes/userRoutes/userRoutes.js";
import cors from "cors"
import { sheetRouter } from "./routes/sheet.routes.js";
import { googleAuth } from "./routes/google_callback.js";
import { tokenScheduler } from "./scheduler/token-scheduler.js";
import { execRouter } from "./routes/userRoutes/executionRoutes.js";

const app = express()

const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json())
app.use(cookieParser());

app.use("/user" , userRouter)
app.use('/node', sheetRouter)
app.use('/auth/google', googleAuth) 
app.use('/execute', execRouter)

const PORT= 3002

async function startServer() {
  await NodeRegistry.registerAll()
  tokenScheduler.start();
  ExecutionRegister.initialize()
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
   })
  }

startServer()
