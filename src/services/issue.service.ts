import mongoose from "mongoose";
import Issue, { Priority, Status } from "../models/issue.model";
import User from "../models/user.model";
import Comment from "../models/comment.model";
import {
  CreateIssueDto,
  UpdateIssueDto,
  IssueFilters,
  IssueSummary,
} from "../types/issue.types";
import { isValidObjectId } from "../utils/validation";
import {
  createNotification,
  createNotificationForAllUsers,
} from "../utils/notifications";
import { NotificationType } from "../models/notification.model";

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

  const issueId = String(savedIssue._id);
  const creatorName = creator.name;

  // Create notification for all users about new issue
  await createNotificationForAllUsers(createdById!, {
    title: "Issue Created",
    description: `${creatorName} has created a new issue: "${createDto.title}"`,
    type: NotificationType.ISSUE_CREATED,
    link: `/issues/${issueId}`,
  });

  // If issue is assigned, create specific notification for assignee
  if (assigneeId) {
    const assignee = await User.findById(assigneeId);
    if (assignee) {
      await createNotification({
        recipientId: assigneeId,
        title: "Issue Assigned",
        description: `${creatorName} has assigned you to issue: "${createDto.title}"`,
        type: NotificationType.ISSUE_ASSIGNED,
        link: `/issues/${issueId}`,
      });
    }
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

export const updateIssue = async (id: string, updateDto: UpdateIssueDto, userId?: string) => {
  if (!isValidObjectId(id)) {
    throw new Error("Invalid issue ID format");
  }

  const issue = await Issue.findById(id)
    .populate("createdBy", "name email profileImage")
    .populate("assignee", "name email profileImage");
  if (!issue) {
    throw new Error("Issue not found");
  }

  const oldStatus = issue.status;
  const oldPriority = issue.priority;
  const oldAssignee = issue.assignee 
    ? (typeof issue.assignee === "object" && "_id" in issue.assignee 
        ? String(issue.assignee._id) 
        : String(issue.assignee))
    : null;
  const issueId = String(issue._id);
  const issueTitle = issue.title;

  // Get the user making the update
  let updaterName = "Someone";
  if (userId) {
    const updater = await User.findById(userId);
    if (updater) {
      updaterName = updater.name;
    }
  } else if (issue.createdBy && typeof issue.createdBy === "object" && "name" in issue.createdBy) {
    updaterName = (issue.createdBy as { name: string }).name;
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

  // Create notifications for changes
  const newAssigneeId = updatedIssue.assignee 
    ? (typeof updatedIssue.assignee === "object" && "_id" in updatedIssue.assignee 
        ? String(updatedIssue.assignee._id) 
        : String(updatedIssue.assignee))
    : null;

  // Notification for status change
  if (updateDto.status !== undefined && oldStatus !== updateDto.status) {
    const recipients: (string | mongoose.Types.ObjectId)[] = [];
    
    // Notify assignee if exists
    if (updatedIssue.assignee) {
      recipients.push(updatedIssue.assignee._id);
    }
    
    // Notify creator if different from assignee
    if (updatedIssue.createdBy && String(updatedIssue.createdBy._id) !== String(updatedIssue.assignee?._id || "")) {
      recipients.push(updatedIssue.createdBy._id);
    }

    for (const recipientId of recipients) {
      await createNotification({
        recipientId,
        title: "Status Changed",
        description: `${updaterName} has changed the status of issue "${issueTitle}" from ${oldStatus} to ${updateDto.status}`,
        type: NotificationType.STATUS_CHANGED,
        link: `/issues/${issueId}`,
      });
    }
  }

  // Notification for priority change
  if (updateDto.priority !== undefined && oldPriority !== updateDto.priority) {
    const recipients: (string | mongoose.Types.ObjectId)[] = [];
    
    // Notify assignee if exists
    if (updatedIssue.assignee) {
      recipients.push(updatedIssue.assignee._id);
    }
    
    // Notify creator if different from assignee
    if (updatedIssue.createdBy && String(updatedIssue.createdBy._id) !== String(updatedIssue.assignee?._id || "")) {
      recipients.push(updatedIssue.createdBy._id);
    }

    for (const recipientId of recipients) {
      await createNotification({
        recipientId,
        title: "Priority Changed",
        description: `${updaterName} has changed the priority of issue "${issueTitle}" from ${oldPriority} to ${updateDto.priority}`,
        type: NotificationType.PRIORITY_CHANGED,
        link: `/issues/${issueId}`,
      });
    }
  }

  // Notification for assignment change
  if (updateDto.assignee !== undefined && oldAssignee !== newAssigneeId) {
    // Notify new assignee if assigned
    if (newAssigneeId && newAssigneeId !== oldAssignee) {
      await createNotification({
        recipientId: newAssigneeId,
        title: "Issue Assigned",
        description: `${updaterName} has assigned you to issue: "${issueTitle}"`,
        type: NotificationType.ISSUE_ASSIGNED,
        link: `/issues/${issueId}`,
      });
    }

    // Notify old assignee if unassigned
    if (oldAssignee && !newAssigneeId) {
      await createNotification({
        recipientId: oldAssignee,
        title: "Issue Unassigned",
        description: `${updaterName} has unassigned you from issue: "${issueTitle}"`,
        type: NotificationType.ISSUE_UPDATED,
        link: `/issues/${issueId}`,
      });
    }
  }

  // General update notification (if other fields changed)
  if (
    (updateDto.title !== undefined || updateDto.description !== undefined) &&
    updateDto.status === undefined &&
    updateDto.priority === undefined &&
    updateDto.assignee === undefined
  ) {
    const recipients: (string | mongoose.Types.ObjectId)[] = [];
    
    // Notify assignee if exists
    if (updatedIssue.assignee) {
      recipients.push(updatedIssue.assignee._id);
    }
    
    // Notify creator if different from assignee
    if (updatedIssue.createdBy && String(updatedIssue.createdBy._id) !== String(updatedIssue.assignee?._id || "")) {
      recipients.push(updatedIssue.createdBy._id);
    }

    for (const recipientId of recipients) {
      await createNotification({
        recipientId,
        title: "Issue Updated",
        description: `${updaterName} has updated issue: "${issueTitle}"`,
        type: NotificationType.ISSUE_UPDATED,
        link: `/issues/${issueId}`,
      });
    }
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

export const getMentionedIssues = async (userId: string, filters?: Omit<IssueFilters, "assignee">) => {
  if (!isValidObjectId(userId)) {
    throw new Error("Invalid user ID format");
  }

  // Find all comments where the user is mentioned
  const commentsWithMentions = await Comment.find({
    mentions: new mongoose.Types.ObjectId(userId),
  }).distinct("issue");

  if (commentsWithMentions.length === 0) {
    return {
      issues: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    };
  }

  const query: any = {
    _id: { $in: commentsWithMentions },
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
