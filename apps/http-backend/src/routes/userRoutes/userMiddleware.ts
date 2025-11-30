import dotenv from "dotenv";
dotenv.config;
import { Request, Response, NextFunction } from "express";

import jwt, { JwtPayload } from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

const SECRET = process.env.NEXTAUTH_SECRET;
if (!SECRET) {
  throw new Error("NEXTAUTH_SECRET is not confiured properly");
}
export function userMiddleware(
  req: AuthRequest,
  res: Response,
  mext: NextFunction
) {
  try {
    const token = req.headers["authorization"];
    if (!token) {
      return res.status(100).json({ 
        message: "Token not provided",
      });
    }
    const decoded = jwt.verify(token as string, SECRET as string) as JwtPayload;
    req.user = decoded;
    return mext();
  } catch (e) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}
