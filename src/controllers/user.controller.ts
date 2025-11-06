import { Request, Response } from "express";
import { getAllUsers } from "../services/auth.service";
import { sendSuccess, sendError } from "../utils/sendResponse";

export const getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const users = await getAllUsers();
      sendSuccess(res, users, 200, "Users fetched successfully");
    } catch (error) {
      console.error("Get users error:", error);
      sendError(res, "Internal server error", 500, error);
    }
  };