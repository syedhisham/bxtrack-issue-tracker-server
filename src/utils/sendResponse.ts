import { Response } from "express";

interface SuccessResponse<T> {
  success: true;
  message?: string;
  data: T;
}

interface ErrorResponse {
  success: false;
  message: string;
  error?: any;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  message?: string
): void => {
  const response: SuccessResponse<T> = {
    success: true,
    ...(message && { message }),
    data,
  };
  res.status(statusCode).json(response);
};


export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  error?: any
): void => {
  const response: ErrorResponse = {
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && error && { error }),
  };
  res.status(statusCode).json(response);
};

