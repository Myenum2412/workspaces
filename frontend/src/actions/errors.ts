"use server";

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code = "API_ERROR") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export class ValidationError extends Error {
  fields: Record<string, string>;

  constructor(fields: Record<string, string>) {
    const message = Object.entries(fields)
      .map(([field, error]) => `${field}: ${error}`)
      .join(", ");
    super(message);
    this.name = "ValidationError";
    this.fields = fields;
  }
}
