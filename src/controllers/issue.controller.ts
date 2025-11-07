import { Request, Response } from "express";
import {
  createIssue,
  getIssues,
  getIssueById,
  updateIssue,
  getIssueSummary,
  getMyIssues,
} from "../services/issue.service";
import { CreateIssueDto, UpdateIssueDto, IssueFilters } from "../types/issue.types";
import { Priority, Status } from "../models/issue.model";
import { sendSuccess, sendError } from "../utils/sendResponse";
import { isValidObjectId } from "../utils/validation";

export const createIssueController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, priority, status, assignee } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      sendError(res, "Title is required", 400);
      return;
    }

    if (!description || !description.trim()) {
      sendError(res, "Description is required", 400);
      return;
    }

    // Validate priority enum
    if (priority && !Object.values(Priority).includes(priority)) {
      sendError(res, `Invalid priority. Must be one of: ${Object.values(Priority).join(", ")}`, 400);
      return;
    }

    // Validate status enum
    if (status && !Object.values(Status).includes(status)) {
      sendError(res, `Invalid status. Must be one of: ${Object.values(Status).join(", ")}`, 400);
      return;
    }

    // Get createdBy from authenticated user
    if (!req.user || !req.user.userId) {
      sendError(res, "Authentication required", 401);
      return;
    }

    const createDto: CreateIssueDto = {
      title: title.trim(),
      description: description.trim(),
      priority: priority || Priority.MEDIUM,
      status: status || Status.OPEN,
      assignee: assignee || null,
      createdBy: req.user.userId,
    };

    const issue = await createIssue(createDto);
    sendSuccess(res, issue, 201, "Issue created successfully");
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
    }
    console.error("Create issue error:", error);
    sendError(res, "Internal server error", 500, error);
  }
};

export const getIssuesController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, priority, assignee, page, limit } = req.query;

    // Validate status enum if provided
    if (status && !Object.values(Status).includes(status as Status)) {
      sendError(res, `Invalid status. Must be one of: ${Object.values(Status).join(", ")}`, 400);
      return;
    }

    // Validate priority enum if provided
    if (priority && !Object.values(Priority).includes(priority as Priority)) {
      sendError(res, `Invalid priority. Must be one of: ${Object.values(Priority).join(", ")}`, 400);
      return;
    }

    // Validate assignee ID format if provided (and not "unassigned" or "null")
    if (assignee && assignee !== "unassigned" && assignee !== "null") {
      if (!isValidObjectId(assignee as string)) {
        sendError(res, "Invalid assignee ID format. Must be a valid MongoDB ObjectId, 'unassigned', or 'null'", 400);
        return;
      }
    }

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

    const filters: IssueFilters = {
      ...(status && { status: status as Status }),
      ...(priority && { priority: priority as Priority }),
      ...(assignee && { assignee: assignee as string }),
      page: pageNum,
      limit: limitNum,
    };

    const result = await getIssues(filters);
    sendSuccess(res, result);
  } catch (error) {
    // Handle specific error from service
    if (error instanceof Error && error.message.includes("Invalid user ID format")) {
      sendError(res, "Invalid assignee ID format", 400, error);
      return;
    }
    console.error("Get issues error:", error);
    sendError(res, "Internal server error", 500, error);
  }
};

export const getIssueByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      sendError(res, "Invalid issue ID format", 400);
      return;
    }

    const issue = await getIssueById(id);
    sendSuccess(res, issue);
  } catch (error) {
    if (error instanceof Error && error.message === "Issue not found") {
      sendError(res, "Issue not found", 404, error);
      return;
    }
    if (error instanceof Error && error.message.includes("Invalid")) {
      sendError(res, error.message, 400, error);
      return;
    }
    console.error("Get issue by ID error:", error);
    sendError(res, "Internal server error", 500, error);
  }
};

export const updateIssueController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, priority, status, assignee } = req.body;

    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      sendError(res, "Invalid issue ID format", 400);
      return;
    }

    // Validate priority enum if provided
    if (priority && !Object.values(Priority).includes(priority)) {
      sendError(res, `Invalid priority. Must be one of: ${Object.values(Priority).join(", ")}`, 400);
      return;
    }

    // Validate status enum if provided
    if (status && !Object.values(Status).includes(status)) {
      sendError(res, `Invalid status. Must be one of: ${Object.values(Status).join(", ")}`, 400);
      return;
    }

    // Build update DTO
    const updateDto: UpdateIssueDto = {};
    if (title !== undefined) updateDto.title = title.trim();
    if (description !== undefined) updateDto.description = description.trim();
    if (priority !== undefined) updateDto.priority = priority;
    if (status !== undefined) updateDto.status = status;
    if (assignee !== undefined) updateDto.assignee = assignee || null;

    // Check if at least one field is being updated
    if (Object.keys(updateDto).length === 0) {
      sendError(res, "At least one field must be provided for update", 400);
      return;
    }

    const issue = await updateIssue(id, updateDto);
    sendSuccess(res, issue, 200, "Issue updated successfully");
  } catch (error) {
    if (error instanceof Error && error.message === "Issue not found") {
      sendError(res, "Issue not found", 404, error);
      return;
    }
    if (error instanceof Error && error.message.includes("not found")) {
      sendError(res, error.message, 404, error);
      return;
    }
    if (error instanceof Error && error.message.includes("Invalid")) {
      sendError(res, error.message, 400, error);
      return;
    }
    console.error("Update issue error:", error);
    sendError(res, "Internal server error", 500, error);
  }
};

export const getMyIssuesController = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get user ID from authenticated request
    if (!req.user || !req.user.userId) {
      sendError(res, "Authentication required", 401);
      return;
    }

    const { status, priority, page, limit } = req.query;

    // Validate status enum if provided
    if (status && !Object.values(Status).includes(status as Status)) {
      sendError(res, `Invalid status. Must be one of: ${Object.values(Status).join(", ")}`, 400);
      return;
    }

    // Validate priority enum if provided
    if (priority && !Object.values(Priority).includes(priority as Priority)) {
      sendError(res, `Invalid priority. Must be one of: ${Object.values(Priority).join(", ")}`, 400);
      return;
    }

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

    const filters: Omit<IssueFilters, "assignee"> = {
      ...(status && { status: status as Status }),
      ...(priority && { priority: priority as Priority }),
      page: pageNum,
      limit: limitNum,
    };

    const result = await getMyIssues(req.user.userId, filters);
    sendSuccess(res, result);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Invalid")) {
      sendError(res, error.message, 400, error);
      return;
    }
    console.error("Get my issues error:", error);
    sendError(res, "Internal server error", 500, error);
  }
};

export const getIssueSummaryController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assigneePage, assigneeLimit } = req.query;

    // Validate pagination parameters for assignees
    const pageNum = assigneePage ? parseInt(assigneePage as string, 10) : 1;
    const limitNum = assigneeLimit ? parseInt(assigneeLimit as string, 10) : 5;

    if (pageNum < 1) {
      sendError(res, "Assignee page must be greater than 0", 400);
      return;
    }

    if (limitNum < 1 || limitNum > 50) {
      sendError(res, "Assignee limit must be between 1 and 50", 400);
      return;
    }

    const summary = await getIssueSummary(pageNum, limitNum);
    sendSuccess(res, summary);
  } catch (error) {
    console.error("Get issue summary error:", error);
    sendError(res, "Internal server error", 500, error);
  }
};

