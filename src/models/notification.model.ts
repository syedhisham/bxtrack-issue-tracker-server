import mongoose, { Document, Schema } from "mongoose";

export enum NotificationType {
  ISSUE_CREATED = "issue_created",
  ISSUE_ASSIGNED = "issue_assigned",
  ISSUE_UPDATED = "issue_updated",
  STATUS_CHANGED = "status_changed",
  PRIORITY_CHANGED = "priority_changed",
  COMMENT_ADDED = "comment_added",
  MENTIONED = "mentioned",
}

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: NotificationType;
  read: boolean;
  link?: string; // Optional link to related resource (e.g., issue ID)
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });

const Notification = mongoose.model<INotification>("Notification", notificationSchema);

export default Notification;

