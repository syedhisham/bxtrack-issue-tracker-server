import mongoose from "mongoose";
import Notification, { NotificationType } from "../models/notification.model";
import User from "../models/user.model";

interface CreateNotificationParams {
  recipientId: string | mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: NotificationType;
  link?: string;
}

/**
 * Create a single notification for a user
 */
export const createNotification = async (params: CreateNotificationParams): Promise<void> => {
  try {
    const recipientIdObj =
      typeof params.recipientId === "string"
        ? new mongoose.Types.ObjectId(params.recipientId)
        : params.recipientId;

    // Validate that recipient exists
    const recipient = await User.findById(recipientIdObj);
    if (!recipient) {
      console.error(`Notification creation failed: Recipient user not found: ${params.recipientId}`);
      return;
    }

    const notification = new Notification({
      recipientId: recipientIdObj,
      title: params.title.trim(),
      description: params.description.trim(),
      type: params.type,
      read: false,
      link: params.link,
    });

    await notification.save();
  } catch (error) {
    console.error("Error creating notification:", error);
    // Don't throw error - notifications are non-critical
  }
};

/**
 * Create notifications for multiple recipients
 */
export const createNotificationsForUsers = async (
  recipientIds: (string | mongoose.Types.ObjectId)[],
  params: Omit<CreateNotificationParams, "recipientId">
): Promise<void> => {
  try {
    const notifications = recipientIds.map((recipientId) => {
      const recipientIdObj =
        typeof recipientId === "string" ? new mongoose.Types.ObjectId(recipientId) : recipientId;

      return {
        recipientId: recipientIdObj,
        title: params.title.trim(),
        description: params.description.trim(),
        type: params.type,
        read: false,
        link: params.link,
      };
    });

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error("Error creating notifications for users:", error);
    // Don't throw error - notifications are non-critical
  }
};

/**
 * Create notification for all users except the sender
 */
export const createNotificationForAllUsers = async (
  senderId: string | mongoose.Types.ObjectId,
  params: Omit<CreateNotificationParams, "recipientId">
): Promise<void> => {
  try {
    const senderIdObj =
      typeof senderId === "string" ? new mongoose.Types.ObjectId(senderId) : senderId;

    // Get all users except the sender
    const users = await User.find({ _id: { $ne: senderIdObj } }).select("_id");
    const recipientIds: (string | mongoose.Types.ObjectId)[] = users.map((user) => 
      user._id as mongoose.Types.ObjectId
    );

    if (recipientIds.length > 0) {
      await createNotificationsForUsers(recipientIds, params);
    }
  } catch (error) {
    console.error("Error creating notifications for all users:", error);
    // Don't throw error - notifications are non-critical
  }
};

