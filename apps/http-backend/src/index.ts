// import {prismaClient} from '@repo/db/index.js'
// import axios from "axios";
import { prismaClient } from "@repo/db/client";
import cookieParser from 'cookie-parser'


import { NodeRegistry } from "@repo/nodes/nodeClient";
import express from "express";
import { userRouter } from "./routes/userRoutes/userRoutes.js";
import cors from "cors"

const app = express()

const allowedOrigins = ['http://localhost:3000' , 'http://localhost:3001' ];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json())
app.use(cookieParser());
// const main = async () => {
//   try {
//     const users = await prismaClient.user.findMany();
//     console.log("Users from DB:", users);
//   } catch (err) {
//     console.error("Error fetching users:", err);
//   }
// };

// main().then(() => {
//   console.log("This log is from http Backend");
// });

app.use("/user" , userRouter)
const PORT= 3002
async function startServer() {
  await NodeRegistry.registerAll()

  app.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
	 })
  }


   startServer()
