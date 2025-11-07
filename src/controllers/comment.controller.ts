import { Request, Response } from "express";
import { createComment, getCommentsByIssue, updateComment, deleteComment } from "../services/comment.service";
import { CreateCommentDto, UpdateCommentDto } from "../types/comment.types";
import { sendSuccess, sendError } from "../utils/sendResponse";

export const createCommentController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, issue, issueId, mentions } = req.body;

    // Validate required fields
    if (!content || !content.trim()) {
      sendError(res, "Comment content is required", 400);
      return;
    }

    const issueIdValue = issue || issueId;
    if (!issueIdValue) {
      sendError(res, "Issue ID is required", 400);
      return;
    }

    // Get user ID from authenticated request
    if (!req.user || !req.user.userId) {
      sendError(res, "Authentication required", 401);
      return;
    }

    const createDto: CreateCommentDto = {
      content: content.trim(),
      issue: issueIdValue,
      mentions: mentions && Array.isArray(mentions) ? mentions : undefined,
    };

    const comment = await createComment(createDto, req.user.userId);
    sendSuccess(res, comment, 201, "Comment created successfully");
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        sendError(res, error.message, 404, error);
        return;
      }
      if (error.message.includes("Invalid")) {
        sendError(res, error.message, 400, error);
        return;
      }
      if (error.message.includes("required")) {
        sendError(res, error.message, 400, error);
        return;
      }
    }
    console.error("Create comment error:", error);
    sendError(res, "Internal server error", 500, error);
  }
};

export const getCommentsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { issueId } = req.params;
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

    const result = await getCommentsByIssue(issueId, pageNum, limitNum);
    sendSuccess(res, result);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Invalid")) {
      sendError(res, error.message, 400, error);
      return;
    }
    if (error instanceof Error && error.message.includes("not found")) {
      sendError(res, error.message, 404, error);
      return;
    }
    console.error("Get comments error:", error);
    sendError(res, "Internal server error", 500, error);
  }
};

export const updateCommentController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content, mentions } = req.body;

    // Validate content
    if (!content || !content.trim()) {
      sendError(res, "Comment content is required", 400);
      return;
    }

    // Get user ID from authenticated request
    if (!req.user || !req.user.userId) {
      sendError(res, "Authentication required", 401);
      return;
    }

    const updateDto: UpdateCommentDto = {
      content: content.trim(),
      mentions: mentions && Array.isArray(mentions) ? mentions : undefined,
    };

    const comment = await updateComment(id, updateDto, req.user.userId);
    sendSuccess(res, comment, 200, "Comment updated successfully");
  } catch (error) {
    if (error instanceof Error && error.message === "Comment not found") {
      sendError(res, "Comment not found", 404, error);
      return;
    }
    if (error instanceof Error && error.message.includes("only update")) {
      sendError(res, error.message, 403, error);
      return;
    }
    if (error instanceof Error && error.message.includes("Invalid")) {
      sendError(res, error.message, 400, error);
      return;
    }
    if (error instanceof Error && error.message.includes("required")) {
      sendError(res, error.message, 400, error);
      return;
    }
    console.error("Update comment error:", error);
    sendError(res, "Internal server error", 500, error);
  }
};

export const deleteCommentController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Get user ID from authenticated request
    if (!req.user || !req.user.userId) {
      sendError(res, "Authentication required", 401);
      return;
    }

    await deleteComment(id, req.user.userId);
    sendSuccess(res, { message: "Comment deleted successfully" }, 200, "Comment deleted successfully");
  } catch (error) {
    if (error instanceof Error && error.message === "Comment not found") {
      sendError(res, "Comment not found", 404, error);
      return;
    }
    if (error instanceof Error && error.message.includes("only delete")) {
      sendError(res, error.message, 403, error);
      return;
    }
    if (error instanceof Error && error.message.includes("Invalid")) {
      sendError(res, error.message, 400, error);
      return;
    }
    console.error("Delete comment error:", error);
    sendError(res, "Internal server error", 500, error);
  }
};

