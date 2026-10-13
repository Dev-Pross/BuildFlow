import { statusCodes } from "@repo/common/zod";
import dotenv from "dotenv";
dotenv.config();
import { Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { getToken } from "next-auth/jwt";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

const SECRET = process.env.NEXTAUTH_SECRET;

if (!SECRET) {
  throw new Error("NEXTAUTH_SECRET is not configured properly");
}

export async function userMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // console.log(req.cookies);
    const authHeader = req.headers.authorization;
    let payload: JwtPayload | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      payload = jwt.verify(token!, SECRET!) as JwtPayload;
    } else {
      payload = (await getToken({ req, secret: SECRET })) as JwtPayload | null;
    }

    if (!payload) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Token not provided or invalid",
      });
    }

    req.user = payload;
    return next();
  } catch (e) {
    return res.status(statusCodes.UNAUTHORIZED).json({
      message: `Invalid token: ${e instanceof Error ? e.message : "Unknown error"}`,
    });
  }
}
