import mongoose, { Document, Schema } from "mongoose";

export enum Priority {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High",
}

export enum Status {
  OPEN = "Open",
  IN_PROGRESS = "In Progress",
  RESOLVED = "Resolved",
}

export interface IIssue extends Document {
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  assignee: mongoose.Types.ObjectId | null;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const issueSchema = new Schema<IIssue>(
  {
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
    priority: {
      type: String,
      enum: Object.values(Priority),
      required: true,
      default: Priority.MEDIUM,
    },
    status: {
      type: String,
      enum: Object.values(Status),
      required: true,
      default: Status.OPEN,
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
issueSchema.index({ status: 1 });
issueSchema.index({ priority: 1 });
issueSchema.index({ assignee: 1 });
issueSchema.index({ createdAt: -1 });

const Issue = mongoose.model<IIssue>("Issue", issueSchema);

export default Issue;

