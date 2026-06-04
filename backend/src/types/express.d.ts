import "express";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: {
        userId: string;
        email: string;
        organizationId: string;
        workspaceId: string | null;
        role: string;
      };
      tenantContext?: {
        organizationId: string;
        workspaceId: string | null;
        userId: string;
        role: string;
      };
      validatedQuery?: Record<string, unknown>;
      validatedParams?: Record<string, unknown>;
    }
  }
}

export {};
