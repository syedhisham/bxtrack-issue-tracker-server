import mongoose, { Document, Schema } from "mongoose";

export interface IComment extends Document {
  content: string;
  issue: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  mentions: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    issue: {
      type: Schema.Types.ObjectId,
      ref: "Issue",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mentions: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
commentSchema.index({ issue: 1, createdAt: -1 });
commentSchema.index({ createdBy: 1 });
commentSchema.index({ mentions: 1 });

const Comment = mongoose.model<IComment>("Comment", commentSchema);

export default Comment;

