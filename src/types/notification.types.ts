import { NotificationType } from "../models/notification.model";

export interface NotificationResponse {
  _id: string;
  recipientId: string;
  title: string;
  description: string;
  type: NotificationType;
  read: boolean;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedNotifications {
  notifications: NotificationResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

