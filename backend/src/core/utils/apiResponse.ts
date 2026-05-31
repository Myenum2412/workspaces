import { Response } from "express";

/**
 * Standardized API response builder.
 * All API responses follow a consistent shape:
 *
 * Success: { success: true, data: T, meta: { requestId, timestamp, pagination? } }
 * Error:   { success: false, error: { code, message, details?, reference? }, meta: { requestId, timestamp } }
 */

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
  /** Send a success response with data */
  success<T>(res: Response, data: T, statusCode: number = 200, requestId?: string, pagination?: PaginationMeta) {
    const response: SuccessResponse<T> = {
      success: true,
      data,
      meta: buildMeta(requestId, pagination),
    };
    return res.status(statusCode).json(response);
  },

  /** Send a created response (201) */
  created<T>(res: Response, data: T, requestId?: string) {
    return this.success(res, data, 201, requestId);
  },

  /** Send a no-content response (204) */
  noContent(res: Response) {
    return res.status(204).send();
  },

  /** Send a paginated list response */
  paginated<T>(
    res: Response,
    data: T[],
    total: number,
    page: number,
    limit: number,
    requestId?: string
  ) {
    const pages = Math.ceil(total / limit);
    return this.success(res, data, 200, requestId, {
      page,
      limit,
      total,
      pages,
      hasNext: page * limit < total,
      hasPrev: page > 1,
    });
  },
};
