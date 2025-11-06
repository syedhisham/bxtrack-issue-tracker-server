import { Priority, Status } from "../models/issue.model";

export interface CreateIssueDto {
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  assignee?: string | null; // userId as string, or null for unassigned
  createdBy: string; // userId as string
}

export interface UpdateIssueDto {
  title?: string;
  description?: string;
  priority?: Priority;
  status?: Status;
  assignee?: string | null; // userId as string, or null for unassigned
}

export interface IssueFilters {
  status?: Status;
  priority?: Priority;
  assignee?: string; // userId
  page?: number;
  limit?: number;
}

export interface PaginatedIssues {
  issues: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IssueSummary {
  total: number;
  byStatus: {
    [key in Status]: number;
  };
  byPriority: {
    [key in Priority]: number;
  };
  byAssignee: Array<{
    assigneeId: string | null;
    assigneeName: string | null;
    profileImage: string | null;
    email: string | null;
    count: number;
  }>;
}

