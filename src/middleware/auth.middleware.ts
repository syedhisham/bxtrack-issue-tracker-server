import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { sendError } from "../utils/sendResponse";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Try to get token from cookie first
    let token = req.cookies?.token;

    // If not in cookie, try Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    // If no token found
    if (!token) {
      sendError(res, "Authentication required. Please login.", 401);
      return;
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      sendError(res, "Invalid or expired token. Please login again.", 401);
      return;
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    sendError(res, "Authentication failed", 401, error);
  }
};

