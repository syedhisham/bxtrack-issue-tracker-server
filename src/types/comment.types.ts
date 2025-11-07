export interface CreateCommentDto {
  content: string;
  issue: string; // issueId
  mentions?: string[]; // userIds
}

export interface UpdateCommentDto {
  content: string;
  mentions?: string[]; // userIds
}

export interface CommentResponse {
  _id: string;
  content: string;
  issue: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  mentions: Array<{
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedComments {
  comments: CommentResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

