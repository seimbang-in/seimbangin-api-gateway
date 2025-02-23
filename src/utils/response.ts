import { Response } from "express";

interface SuccessResponse {
  res: Response;
  message: string;
  data?: any;
  meta?: any;
  status?: number; // Menambahkan status opsional untuk success response
}

interface ErrorResponse {
  res: Response;
  status?: number; // Biar bisa default ke 500
  message: string;
  data?: any;
}

export const createResponse = {
  success: ({
    res,
    message,
    data = null,
    meta = null,
    status = 200, // Default ke 200, tapi bisa diubah
  }: SuccessResponse) => {
    res.status(status).json({
      status: "success",
      code: status,
      message,
      data,
      meta,
    });
  },

  error: ({
    res,
    status = 500, // Default ke 500
    message = "An error occurred",
    data = null,
  }: ErrorResponse) => {
    res.status(status).json({
      status: "error",
      code: status,
      message,
      data,
    });
  },
};
