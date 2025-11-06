import { Request, Response } from "express";
import { loginUser, getAllUsers } from "../services/auth.service";
import { LoginDto, LoginResponse } from "../types/user.types";
import { sendSuccess, sendError } from "../utils/sendResponse";
import { generateToken } from "../utils/jwt";

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    // Validate email is provided
    if (!email) {
      sendError(res, "Email is required", 400);
      return;
    }

    // Validate email format (basic validation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      sendError(res, "Invalid email format", 400);
      return;
    }

    // Create login DTO
    const loginDto: LoginDto = { email };

    const user = await loginUser(loginDto);

    // Generate JWT token
    const token = generateToken({
      userId: user._id,
      email: user.email,
    });

    // Set token in HTTP-only cookie (more secure)
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    res.cookie("token", token, cookieOptions);

    // Also sending token in response (for flexibility - frontend can choose to use cookie or store in localStorage)
    const loginResponse: LoginResponse = {
      user,
      token,
    };

    sendSuccess(res, loginResponse, 200, "Login successful");
  } catch (error) {
    // Handle user not found error
    if (error instanceof Error && error.message === "User not found") {
      sendError(res, "User not found. Please check your email.", 404, error);
      return;
    }

    // Handle other errors
    console.error("Login error:", error);
    sendError(res, "Internal server error", 500, error);
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Clear the token cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    sendSuccess(res, { message: "Logged out successfully" }, 200, "Logout successful");
  } catch (error) {
    console.error("Logout error:", error);
    sendError(res, "Internal server error", 500, error);
  }
};


