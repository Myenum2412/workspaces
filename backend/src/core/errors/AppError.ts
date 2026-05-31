/**
 * AppError — Base error class for all application errors.
 * Provides structured error responses with codes, status codes, and optional details.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, unknown>;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    details?: Record<string, unknown>,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(requestId?: string) {
    return {
      success: false as const,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
        ...(requestId && { reference: requestId }),
      },
      meta: {
        timestamp: new Date().toISOString(),
        ...(requestId && { requestId }),
      },
    };
  }
}

/** 400 — Validation or bad request */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

/** 401 — Authentication required or invalid */
export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "AUTH_REQUIRED");
  }
}

/** 403 — Insufficient permissions */
export class AuthorizationError extends AppError {
  constructor(message: string = "Insufficient permissions") {
    super(message, 403, "FORBIDDEN");
  }
}

/** 404 — Resource not found */
export class NotFoundError extends AppError {
  constructor(resource: string = "Resource", identifier?: string) {
    const message = identifier
      ? `${resource} not found: ${identifier}`
      : `${resource} not found`;
    super(message, 404, "NOT_FOUND");
  }
}

/** 409 — Conflict (duplicate, already exists) */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
  }
}

/** 429 — Rate limit exceeded */
export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests. Please slow down.") {
    super(message, 429, "RATE_LIMITED");
  }
}

/** 423 — Account locked */
export class AccountLockedError extends AppError {
  constructor(message: string = "Account is locked due to too many failed attempts. Try again later.") {
    super(message, 423, "ACCOUNT_LOCKED");
  }
}
