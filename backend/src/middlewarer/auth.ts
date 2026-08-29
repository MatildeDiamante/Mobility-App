// Authentication through JSON Web Tokens
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "../../mongodbModels/userRole";

const jwtSecret: jwt.Secret = process.env.JWT_SECRET ?? "";

if (!jwtSecret) {
  throw new Error("JWT_SECRET is not configured");
}

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
  };
}

export function authenticate(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): void {
  const token = request.cookies?.accessToken;

  if (!token) {
    response.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    request.user = jwt.verify(token, jwtSecret) as {
      userId: string;
      role: UserRole;
    };

    next();
  } catch {
    response.status(401).json({ message: "Invalid or expired token" });
  }
}

export function authorize(...roles: UserRole[]) {
  return (
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): void => {
    if (!request.user || !roles.includes(request.user.role)) {
      response.status(403).json({ message: "Forbidden" });
      return;
    }

    next();
  };
}
