import mongoose from "mongoose";
import Notification from "../models/notification.model";
import { isValidObjectId } from "../utils/validation";
import { NotificationResponse, PaginatedNotifications } from "../types/notification.types";

// Helper to format notification response
const formatNotification = (notification: any): NotificationResponse => {
  return {
    _id: String(notification._id),
    recipientId: String(notification.recipientId),
    title: notification.title,
    description: notification.description,
    type: notification.type,
    read: notification.read,
    link: notification.link,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  };
};

/**
 * Get all notifications for a user with pagination
 */
export const getNotifications = async (
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedNotifications> => {
  // Validate user ID format
  if (!isValidObjectId(userId)) {
    throw new Error("Invalid user ID format");
  }

  // Validate pagination parameters
  if (page < 1) {
    throw new Error("Page must be greater than 0");
  }

  if (limit < 1 || limit > 100) {
    throw new Error("Limit must be between 1 and 100");
  }

  const skip = (page - 1) * limit;
  const userIdObj = new mongoose.Types.ObjectId(userId);

  // Get total count and unread count
  const total = await Notification.countDocuments({ recipientId: userIdObj });
  const unreadCount = await Notification.countDocuments({
    recipientId: userIdObj,
    read: false,
  });

  // Fetch paginated notifications
  const notifications = await Notification.find({ recipientId: userIdObj })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    notifications: notifications.map(formatNotification),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    unreadCount,
  };
};

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = async (
  notificationId: string,
  userId: string
): Promise<NotificationResponse> => {
  // Validate notification ID format
  if (!isValidObjectId(notificationId)) {
    throw new Error("Invalid notification ID format");
  }

  // Validate user ID format
  if (!isValidObjectId(userId)) {
    throw new Error("Invalid user ID format");
  }

  const notification = await Notification.findById(notificationId);
  if (!notification) {
    throw new Error("Notification not found");
  }

  // Verify that the notification belongs to the user
  if (String(notification.recipientId) !== userId) {
    throw new Error("You can only mark your own notifications as read");
  }

  // Mark as read if not already read
  if (!notification.read) {
    notification.read = true;
    await notification.save();
  }

  return formatNotification(notification);
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<{ count: number }> => {
  // Validate user ID format
  if (!isValidObjectId(userId)) {
    throw new Error("Invalid user ID format");
  }

  const userIdObj = new mongoose.Types.ObjectId(userId);

  // Update all unread notifications for the user
  const result = await Notification.updateMany(
    { recipientId: userIdObj, read: false },
    { read: true }
  );

  return {
    count: result.modifiedCount,
  };
};

