import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

export interface AuthJwtPayload extends JwtPayload {
  userId: string;
  role: "user" | "admin";
  username: string;
}

export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  console.log("TOKEN RECEIVED:", token);

  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as AuthJwtPayload;
    console.log("decoded token:", decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.log("JWT error:", err);
    res.sendStatus(403);
  }
}

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AuthJwtPayload | undefined;

    if (!user) return res.sendStatus(401);

    if (user.role !== role) {
      return res.sendStatus(403);
    }
    next();
  };
}