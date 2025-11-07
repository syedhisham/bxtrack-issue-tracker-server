import mongoose from "mongoose";
import Issue, { Priority, Status } from "../models/issue.model";
import User from "../models/user.model";
import {
  CreateIssueDto,
  UpdateIssueDto,
  IssueFilters,
  IssueSummary,
} from "../types/issue.types";
import { isValidObjectId } from "../utils/validation";

// Helper to validate and convert string to ObjectId
const toObjectId = (
  id: string | null | undefined
): mongoose.Types.ObjectId | null => {
  if (!id || id === "null" || id === "unassigned") {
    return null;
  }
  if (!isValidObjectId(id)) {
    throw new Error("Invalid user ID format");
  }
  return new mongoose.Types.ObjectId(id);
};

// Helper to format issue response with populated fields
const formatIssue = (issue: any) => {
  return {
    _id: String(issue._id),
    title: issue.title,
    description: issue.description,
    priority: issue.priority,
    status: issue.status,
    assignee: issue.assignee
      ? {
          _id: String(issue.assignee._id),
          name: issue.assignee.name,
          email: issue.assignee.email,
          profileImage: issue.assignee.profileImage,
        }
      : null,
    createdBy: issue.createdBy
      ? {
          _id: String(issue.createdBy._id),
          name: issue.createdBy.name,
          email: issue.createdBy.email,
          profileImage: issue.createdBy.profileImage,
        }
      : null,
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
  };
};

export const createIssue = async (createDto: CreateIssueDto) => {
  const assigneeId = toObjectId(createDto.assignee);
  const createdById = toObjectId(createDto.createdBy);

  // Validate that createdBy user exists
  const creator = await User.findById(createdById);
  if (!creator) {
    throw new Error("Creator user not found");
  }

  // Validate that assignee user exists if provided
  if (assigneeId) {
    const assignee = await User.findById(assigneeId);
    if (!assignee) {
      throw new Error("Assignee user not found");
    }
  }

  const issue = new Issue({
    title: createDto.title,
    description: createDto.description,
    priority: createDto.priority,
    status: createDto.status,
    assignee: assigneeId,
    createdBy: createdById,
  });

  const savedIssue = await issue.save();
  const populatedIssue = await Issue.findById(savedIssue._id)
    .populate("assignee", "name email profileImage")
    .populate("createdBy", "name email profileImage");

  if (!populatedIssue) {
    throw new Error("Failed to create issue");
  }

  return formatIssue(populatedIssue);
};

export const getIssues = async (filters: IssueFilters) => {
  const query: any = {};

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.priority) {
    query.priority = filters.priority;
  }

  if (filters.assignee) {
    if (filters.assignee === "unassigned" || filters.assignee === "null") {
      query.assignee = null;
    } else {
      const assigneeId = toObjectId(filters.assignee);
      if (assigneeId) {
        query.assignee = assigneeId;
      }
    }
  }

  // Pagination
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const skip = (page - 1) * limit;

  // Get total count for pagination
  const total = await Issue.countDocuments(query);

  // Fetch paginated issues
  const issues = await Issue.find(query)
    .populate("assignee", "name email profileImage")
    .populate("createdBy", "name email profileImage")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    issues: issues.map(formatIssue),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getMyIssues = async (userId: string, filters?: Omit<IssueFilters, "assignee">) => {
  if (!isValidObjectId(userId)) {
    throw new Error("Invalid user ID format");
  }

  const query: any = {
    assignee: new mongoose.Types.ObjectId(userId),
  };

  if (filters?.status) {
    query.status = filters.status;
  }

  if (filters?.priority) {
    query.priority = filters.priority;
  }

  // Pagination
  const page = filters?.page || 1;
  const limit = filters?.limit || 10;
  const skip = (page - 1) * limit;

  // Get total count for pagination
  const total = await Issue.countDocuments(query);

  // Fetch paginated issues
  const issues = await Issue.find(query)
    .populate("assignee", "name email profileImage")
    .populate("createdBy", "name email profileImage")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    issues: issues.map(formatIssue),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getIssueById = async (id: string) => {
  if (!isValidObjectId(id)) {
    throw new Error("Invalid issue ID format");
  }

  const issue = await Issue.findById(id)
    .populate("assignee", "name email profileImage")
    .populate("createdBy", "name email profileImage");

  if (!issue) {
    throw new Error("Issue not found");
  }

  return formatIssue(issue);
};

export const updateIssue = async (id: string, updateDto: UpdateIssueDto) => {
  if (!isValidObjectId(id)) {
    throw new Error("Invalid issue ID format");
  }

  const issue = await Issue.findById(id);
  if (!issue) {
    throw new Error("Issue not found");
  }

  // Update fields if provided
  if (updateDto.title !== undefined) {
    issue.title = updateDto.title;
  }
  if (updateDto.description !== undefined) {
    issue.description = updateDto.description;
  }
  if (updateDto.priority !== undefined) {
    issue.priority = updateDto.priority;
  }
  if (updateDto.status !== undefined) {
    issue.status = updateDto.status;
  }
  if (updateDto.assignee !== undefined) {
    const assigneeId = toObjectId(updateDto.assignee);
    // Validate assignee exists if provided
    if (assigneeId) {
      const assignee = await User.findById(assigneeId);
      if (!assignee) {
        throw new Error("Assignee user not found");
      }
    }
    issue.assignee = assigneeId;
  }

  const updatedIssue = await issue.save();
  const populatedIssue = await Issue.findById(updatedIssue._id)
    .populate("assignee", "name email profileImage")
    .populate("createdBy", "name email profileImage");

  if (!populatedIssue) {
    throw new Error("Failed to update issue");
  }

  return formatIssue(populatedIssue);
};

export const getIssueSummary = async (assigneePage?: number, assigneeLimit?: number): Promise<IssueSummary> => {
  // Get total count
  const total = await Issue.countDocuments();

  // Count by status
  const statusCounts = await Issue.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const byStatus = {
    [Status.OPEN]: 0,
    [Status.IN_PROGRESS]: 0,
    [Status.RESOLVED]: 0,
  };

  statusCounts.forEach((item) => {
    byStatus[item._id as Status] = item.count;
  });

  // Count by priority
  const priorityCounts = await Issue.aggregate([
    {
      $group: {
        _id: "$priority",
        count: { $sum: 1 },
      },
    },
  ]);

  const byPriority = {
    [Priority.LOW]: 0,
    [Priority.MEDIUM]: 0,
    [Priority.HIGH]: 0,
  };

  priorityCounts.forEach((item) => {
    byPriority[item._id as Priority] = item.count;
  });

  // Count by assignee with pagination
  const assigneeCounts = await Issue.aggregate([
    {
      $group: {
        _id: "$assignee",
        count: { $sum: 1 },
      },
    },
  ]);

  // Get total assignees count (including unassigned)
  const totalAssignees = assigneeCounts.length;

  // Apply pagination if provided
  const page = assigneePage || 1;
  const limit = assigneeLimit || 5;
  const skip = (page - 1) * limit;
  const totalPages = Math.ceil(totalAssignees / limit);

  // Get paginated assignee counts
  const paginatedAssigneeCounts = assigneeCounts.slice(skip, skip + limit);

  const byAssignee = await Promise.all(
    paginatedAssigneeCounts.map(async (item) => {
      if (!item._id) {
        return {
          assigneeId: null,
          assigneeName: "Unassigned",
          profileImage: null,
          email: null,
          count: item.count,
        };
      }

      const user = await User.findById(item._id);
      return {
        assigneeId: String(item._id),
        assigneeName: user ? user.name : "Unknown",
        profileImage: user ? user.profileImage : null,
        email: user ? user.email : null,
        count: item.count,
      };
    })
  );

  return {
    total,
    byStatus,
    byPriority,
    byAssignee: byAssignee as Array<{
      assigneeId: string | null;
      assigneeName: string | null;
      profileImage: string | null;
      email: string | null;
      count: number;
    }>,
    assigneePagination: {
      page,
      limit,
      total: totalAssignees,
      totalPages,
    },
  };
};
