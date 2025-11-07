import mongoose from "mongoose";
import Comment from "../models/comment.model";
import Issue from "../models/issue.model";
import User from "../models/user.model";
import { CreateCommentDto, UpdateCommentDto, CommentResponse, PaginatedComments } from "../types/comment.types";
import { isValidObjectId } from "../utils/validation";
import { createNotification } from "../utils/notifications";
import { NotificationType } from "../models/notification.model";

// Helper to format comment response with populated fields
const formatComment = (comment: any): CommentResponse => {
  return {
    _id: String(comment._id),
    content: comment.content,
    issue: String(comment.issue),
    createdBy: comment.createdBy
      ? {
          _id: String(comment.createdBy._id),
          name: comment.createdBy.name,
          email: comment.createdBy.email,
          profileImage: comment.createdBy.profileImage,
        }
      : {
          _id: "",
          name: "Unknown",
          email: "",
        },
    mentions: comment.mentions && Array.isArray(comment.mentions)
      ? comment.mentions.map((user: any) => ({
          _id: String(user._id),
          name: user.name,
          email: user.email,
          profileImage: user.profileImage,
        }))
      : [],
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };
};

export const createComment = async (createDto: CreateCommentDto, userId: string): Promise<CommentResponse> => {
  // Validate issue ID format
  if (!isValidObjectId(createDto.issue)) {
    throw new Error("Invalid issue ID format");
  }

  // Validate user ID format
  if (!isValidObjectId(userId)) {
    throw new Error("Invalid user ID format");
  }

  // Validate that issue exists and get populated issue for notifications
  const issue = await Issue.findById(createDto.issue)
    .populate("createdBy", "name email profileImage")
    .populate("assignee", "name email profileImage");
  if (!issue) {
    throw new Error("Issue not found");
  }

  // Validate that user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Validate content
  if (!createDto.content || !createDto.content.trim()) {
    throw new Error("Comment content is required");
  }

  // Validate and process mentions
  const mentionIds: mongoose.Types.ObjectId[] = [];
  if (createDto.mentions && Array.isArray(createDto.mentions)) {
    for (const mentionId of createDto.mentions) {
      if (!isValidObjectId(mentionId)) {
        throw new Error(`Invalid mention user ID format: ${mentionId}`);
      }
      const mentionedUser = await User.findById(mentionId);
      if (!mentionedUser) {
        throw new Error(`Mentioned user not found: ${mentionId}`);
      }
      mentionIds.push(new mongoose.Types.ObjectId(mentionId));
    }
  }

  const comment = new Comment({
    content: createDto.content.trim(),
    issue: new mongoose.Types.ObjectId(createDto.issue),
    createdBy: new mongoose.Types.ObjectId(userId),
    mentions: mentionIds,
  });

  const savedComment = await comment.save();
  const populatedComment = await Comment.findById(savedComment._id)
    .populate("createdBy", "name email profileImage")
    .populate("mentions", "name email profileImage");

  if (!populatedComment) {
    throw new Error("Failed to create comment");
  }
  
  if (issue) {
    const commenterName = user.name;
    const issueId = String(issue._id);
    const issueTitle = issue.title;
    const commenterId = String(user._id);
    const issueCreatorId = issue.createdBy ? String(issue.createdBy._id) : null;
    const issueAssigneeId = issue.assignee ? String(issue.assignee._id) : null;

    // Notify mentioned users
    if (mentionIds.length > 0) {
      for (const mentionId of mentionIds) {
        const mentionedUserId = String(mentionId);
        // Don't notify if the user mentioned themselves
        if (mentionedUserId !== commenterId) {
          const mentionedUser = await User.findById(mentionId);
          if (mentionedUser) {
            await createNotification({
              recipientId: mentionId,
              title: "You were mentioned",
              description: `${commenterName} has mentioned you in a comment on issue: "${issueTitle}"`,
              type: NotificationType.MENTIONED,
              link: `/issues/${issueId}`,
            });
          }
        }
      }
    }

    // Notify issue creator (if different from commenter and not already mentioned)
    if (issueCreatorId && issueCreatorId !== commenterId) {
      const isAlreadyMentioned = mentionIds.some((id) => String(id) === issueCreatorId);
      if (!isAlreadyMentioned) {
        await createNotification({
          recipientId: issueCreatorId,
          title: "Comment added",
          description: `${commenterName} has added a comment to your issue: "${issueTitle}"`,
          type: NotificationType.COMMENT_ADDED,
          link: `/issues/${issueId}`,
        });
      }
    }

    // Notify issue assignee (if different from commenter, creator, and not already mentioned)
    if (issueAssigneeId && issueAssigneeId !== commenterId && issueAssigneeId !== issueCreatorId) {
      const isAlreadyMentioned = mentionIds.some((id) => String(id) === issueAssigneeId);
      if (!isAlreadyMentioned) {
        await createNotification({
          recipientId: issueAssigneeId,
          title: "Comment added",
          description: `${commenterName} has added a comment to issue: "${issueTitle}"`,
          type: NotificationType.COMMENT_ADDED,
          link: `/issues/${issueId}`,
        });
      }
    }
  }

  return formatComment(populatedComment);
};

export const getCommentsByIssue = async (
  issueId: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedComments> => {
  // Validate issue ID format
  if (!isValidObjectId(issueId)) {
    throw new Error("Invalid issue ID format");
  }

  // Validate that issue exists
  const issue = await Issue.findById(issueId);
  if (!issue) {
    throw new Error("Issue not found");
  }

  // Validate pagination parameters
  if (page < 1) {
    throw new Error("Page must be greater than 0");
  }

  if (limit < 1 || limit > 100) {
    throw new Error("Limit must be between 1 and 100");
  }

  const skip = (page - 1) * limit;

  // Get total count
  const total = await Comment.countDocuments({ issue: new mongoose.Types.ObjectId(issueId) });

  // Fetch paginated comments
  const comments = await Comment.find({ issue: new mongoose.Types.ObjectId(issueId) })
    .populate("createdBy", "name email profileImage")
    .populate("mentions", "name email profileImage")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    comments: comments.map(formatComment),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const updateComment = async (
  commentId: string,
  updateDto: UpdateCommentDto,
  userId: string
): Promise<CommentResponse> => {
  // Validate comment ID format
  if (!isValidObjectId(commentId)) {
    throw new Error("Invalid comment ID format");
  }

  // Validate user ID format
  if (!isValidObjectId(userId)) {
    throw new Error("Invalid user ID format");
  }

  // Validate content
  if (!updateDto.content || !updateDto.content.trim()) {
    throw new Error("Comment content is required");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new Error("Comment not found");
  }

  // Check if user is the creator of the comment
  if (String(comment.createdBy) !== userId) {
    throw new Error("You can only update your own comments");
  }

  comment.content = updateDto.content.trim();

  // Update mentions if provided
  if (updateDto.mentions !== undefined) {
    const mentionIds: mongoose.Types.ObjectId[] = [];
    if (Array.isArray(updateDto.mentions)) {
      for (const mentionId of updateDto.mentions) {
        if (!isValidObjectId(mentionId)) {
          throw new Error(`Invalid mention user ID format: ${mentionId}`);
        }
        const mentionedUser = await User.findById(mentionId);
        if (!mentionedUser) {
          throw new Error(`Mentioned user not found: ${mentionId}`);
        }
        mentionIds.push(new mongoose.Types.ObjectId(mentionId));
      }
    }
    comment.mentions = mentionIds;
  }

  const updatedComment = await comment.save();
  const populatedComment = await Comment.findById(updatedComment._id)
    .populate("createdBy", "name email profileImage")
    .populate("mentions", "name email profileImage");

  if (!populatedComment) {
    throw new Error("Failed to update comment");
  }

  return formatComment(populatedComment);
};

export const deleteComment = async (commentId: string, userId: string): Promise<void> => {
  // Validate comment ID format
  if (!isValidObjectId(commentId)) {
    throw new Error("Invalid comment ID format");
  }

  // Validate user ID format
  if (!isValidObjectId(userId)) {
    throw new Error("Invalid user ID format");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new Error("Comment not found");
  }

  // Check if user is the creator of the comment
  if (String(comment.createdBy) !== userId) {
    throw new Error("You can only delete your own comments");
  }

  await Comment.findByIdAndDelete(commentId);
};

