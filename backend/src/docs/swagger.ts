import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Workspace API",
      version: "2.0.0",
      description: "Production-ready workspace management API",
      contact: { email: "admin@myenum.in" },
    },
    servers: [
      { url: "https://workspaceapi.myenum.in/api/v1", description: "Production" },
      { url: "http://localhost:4000/api/v1", description: "Development" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        cookieAuth: { type: "apiKey", in: "cookie", name: "access_token" },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: {
              type: "object",
              properties: {
                code: { type: "string" },
                message: { type: "string" },
                details: { type: "object" },
                reference: { type: "string" },
              },
            },
            meta: { type: "object", properties: { timestamp: { type: "string" }, requestId: { type: "string" } } },
          },
        },
        PaginationMeta: {
          type: "object",
          properties: { page: { type: "integer" }, limit: { type: "integer" }, total: { type: "integer" }, pages: { type: "integer" }, hasNext: { type: "boolean" }, hasPrev: { type: "boolean" } },
        },
      },
    },
  },
  apis: ["./src/modules/**/routes/*.ts", "./src/modules/**/controllers/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
