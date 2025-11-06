export interface LoginDto {
  email: string;
}

export interface UserResponse {
  _id: string;
  email: string;
  name: string;
  profileImage?: string;
  createdAt: Date;
}

export interface LoginResponse {
  user: UserResponse;
  token: string;
}

