/**
 * Pagination, sorting, filtering helper for list endpoints.
 */
import { Request, Response, NextFunction } from "express";
import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().max(50).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().max(200).optional(),
  status: z.string().max(50).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

export function parsePagination(query: Record<string, unknown>): PaginationParams {
  return paginationSchema.parse(query);
}

export function buildPaginationResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
) {
  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      pages: Math.ceil(total / params.limit),
      hasNext: params.page * params.limit < total,
      hasPrev: params.page > 1,
    },
  };
}
