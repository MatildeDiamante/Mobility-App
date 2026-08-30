// Authentication through JSON Web Tokens
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "../../mongodbModels/userRole";

// Reads and validates JWT_SECRET
const jwtSecret: jwt.Secret = process.env.JWT_SECRET ?? "";

if (!jwtSecret) {
  throw new Error("JWT_SECRET is not configured");
}

// Extends Request type
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
  };
}

// Middleware verifies if the user is logged in
export function authenticate(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): void {
  // Reads token from cookie
  const token = request.cookies?.accessToken;

  // Checks if the token exists
  if (!token) {
    response.status(401).json({ message: "Authentication required" });
    return;
  }

  // Verifies JWT token
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
  // Return a Middleware
  return (
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ) => {
    // Checks if the user is authenticated
    if (!request.user) {
      response.status(403).json({ message: "Forbidden" });
      return;
    }

    // Extract user's role
    const userRole = request.user.role;

    // Check if the role is in the authorized roles list
    const isAuthorized = roles.includes(userRole);

    if (!isAuthorized) {
      response.status(403).json({ message: "Forbidden" });
      return;
    }

    // If everything is allright, it goes to the next middleware
    next();
  };
}
