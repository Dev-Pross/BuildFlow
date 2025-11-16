// import {prismaClient} from '@repo/db/index.js'
// import axios from "axios";
import { prismaClient } from "@repo/db/client";

const main = async () => {
  try {
    const users = await prismaClient.user.findMany();
    console.log("Users from DB:", users);
  } catch (err) {
    console.error("Error fetching users:", err);
  }
};

main().then(() => {
  console.log("This log is from http Backend");
});

