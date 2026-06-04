import { Response } from "express";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ResponseMeta {
  requestId?: string;
  timestamp: string;
  pagination?: PaginationMeta;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta: ResponseMeta;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    reference?: string;
  };
  meta: ResponseMeta;
}

function buildMeta(requestId?: string, pagination?: PaginationMeta): ResponseMeta {
  const meta: ResponseMeta = { timestamp: new Date().toISOString() };
  if (requestId) meta.requestId = requestId;
  if (pagination) meta.pagination = pagination;
  return meta;
}

export const apiResponse = {
  success<T>(res: Response, data: T, statusCode = 200, requestId?: string, pagination?: PaginationMeta) {
    return res.status(statusCode).json({ success: true as const, data, meta: buildMeta(requestId, pagination) });
  },

  created<T>(res: Response, data: T, requestId?: string) {
    return this.success(res, data, 201, requestId);
  },

  noContent(res: Response) {
    return res.status(204).send();
  },

  paginated<T>(res: Response, data: T[], total: number, page: number, limit: number, requestId?: string) {
    const pages = Math.ceil(total / limit);
    return this.success(res, data, 200, requestId, { page, limit, total, pages, hasNext: page * limit < total, hasPrev: page > 1 });
  },

  deleted(res: Response, requestId?: string) {
    return this.success(res, { message: "Deleted successfully" }, 200, requestId);
  },
};
