import mongoose from "mongoose";

export const isValidObjectId = (id: string | null | undefined): boolean => {
  if (!id) {
    return false;
  }
  return mongoose.Types.ObjectId.isValid(id);
};

