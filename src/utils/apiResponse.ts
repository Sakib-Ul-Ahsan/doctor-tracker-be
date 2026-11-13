import { Response } from "express";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  message?: string;
  data: T;
  meta?: PaginationMeta;
}

export function sendSuccess<T>(
  res: Response,
  statusCode: number,
  data: T,
  options?: { message?: string; meta?: PaginationMeta }
): Response<ApiSuccessResponse<T>> {
  const payload: ApiSuccessResponse<T> = {
    success: true,
    data,
  };

  if (options?.message) {
    payload.message = options.message;
  }
  if (options?.meta) {
    payload.meta = options.meta;
  }

  return res.status(statusCode).json(payload);
}

