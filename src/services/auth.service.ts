import User from "../models/user.model";
import { LoginDto, UserResponse } from "../types/user.types";

export const loginUser = async (loginDto: LoginDto): Promise<UserResponse> => {
  const { email } = loginDto;

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    _id: String(user._id),
    email: user.email,
    name: user.name,
    profileImage: user.profileImage,
    createdAt: user.createdAt,
  };
};

export const getAllUsers = async (): Promise<UserResponse[]> => {
  const users = await User.find().sort({ createdAt: -1 });

  return users.map((user) => ({
    _id: String(user._id),
    email: user.email,
    name: user.name,
    profileImage: user.profileImage,
    createdAt: user.createdAt,
  }));
};

