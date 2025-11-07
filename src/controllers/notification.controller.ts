import { Request, Response } from "express";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/notification.service";
import { sendSuccess, sendError } from "../utils/sendResponse";

/**
 * Get all notifications for the logged-in user
 */
export const getNotificationsController = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get user ID from authenticated request
    if (!req.user || !req.user.userId) {
      sendError(res, "Authentication required", 401);
      return;
    }

    const { page, limit } = req.query;

    // Validate pagination parameters
    const pageNum = page ? parseInt(page as string, 10) : 1;
    const limitNum = limit ? parseInt(limit as string, 10) : 10;

    if (pageNum < 1) {
      sendError(res, "Page must be greater than 0", 400);
      return;
    }

    if (limitNum < 1 || limitNum > 100) {
      sendError(res, "Limit must be between 1 and 100", 400);
      return;
    }

    const result = await getNotifications(req.user.userId, pageNum, limitNum);
    sendSuccess(res, result);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Invalid")) {
      sendError(res, error.message, 400, error);
      return;
    }
    console.error("Get notifications error:", error);
    sendError(res, "Internal server error", 500, error);
  }
};

/**
 * Mark a notification as read
 */
export const markNotificationAsReadController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Get user ID from authenticated request
    if (!req.user || !req.user.userId) {
      sendError(res, "Authentication required", 401);
      return;
    }

    const notification = await markNotificationAsRead(id, req.user.userId);
    sendSuccess(res, notification, 200, "Notification marked as read");
  } catch (error) {
    if (error instanceof Error && error.message === "Notification not found") {
      sendError(res, "Notification not found", 404, error);
      return;
    }
    if (error instanceof Error && error.message.includes("only mark")) {
      sendError(res, error.message, 403, error);
      return;
    }
    if (error instanceof Error && error.message.includes("Invalid")) {
      sendError(res, error.message, 400, error);
      return;
    }
    console.error("Mark notification as read error:", error);
    sendError(res, "Internal server error", 500, error);
  }
};

/**
 * Mark all notifications as read for the logged-in user
 */
export const markAllNotificationsAsReadController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get user ID from authenticated request
    if (!req.user || !req.user.userId) {
      sendError(res, "Authentication required", 401);
      return;
    }

    const result = await markAllNotificationsAsRead(req.user.userId);
    sendSuccess(res, result, 200, "All notifications marked as read");
  } catch (error) {
    if (error instanceof Error && error.message.includes("Invalid")) {
      sendError(res, error.message, 400, error);
      return;
    }
    console.error("Mark all notifications as read error:", error);
    sendError(res, "Internal server error", 500, error);
  }
};

