import dotenv from "dotenv";
dotenv.config(); 
import { Request, Response, NextFunction } from "express";
import { getToken } from "next-auth/jwt";

export interface AuthRequest extends Request {
  user?: any; 
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
    console.log(req.cookies)
    const payload = await getToken({ req, secret: SECRET });

    if (!payload) {
      return res.status(401).json({
        message: "Token not provided or invalid",
      });
    }

    console.log("Decoded User:", payload);
    
    req.user = payload;
    return next();
  } catch (e) {
    return res.status(401).json({
      message: `Invalid token: ${e instanceof Error ? e.message : "Unknown error"}`,
    });
  }
}