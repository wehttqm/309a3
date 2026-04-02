const { routeDefinitions } = require("../routes/registry.js");
const {
  createRouteManifest,
  getPathParamNames,
  pathToOpenApi,
} = require("../contracts/route-tools.js");

const routeManifest = createRouteManifest(routeDefinitions);

function buildRequestBody(routeMeta) {
  if (!routeMeta.bodyKind) return undefined;

  if (routeMeta.bodyKind === "multipart") {
    return {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              file: {
                type: "string",
                format: "binary",
              },
            },
            additionalProperties: true,
          },
        },
      },
    };
  }

  return {
    required: false,
    content: {
      "application/json": {
        schema: {
          type: "object",
          additionalProperties: true,
        },
      },
    },
  };
}

function buildSecurity(route) {
  const middlewareNames = route.middlewareIds;

  if (middlewareNames.includes("strictAuth")) {
    return [{ bearerAuth: [] }];
  }

  if (middlewareNames.includes("optionalAuth")) {
    return [{ bearerAuth: [] }, {}];
  }

  return undefined;
}

function buildResponses(route) {
  if (route.method === "DELETE") {
    return {
      200: {
        description: "Successful response.",
        content: {
          "application/json": {
            schema: {
              oneOf: [
                { type: "object", additionalProperties: true },
                { type: "string" },
                { type: "null" },
              ],
            },
          },
        },
      },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" },
      404: { description: "Not Found" },
    };
  }

  return {
    200: {
      description: "Successful response.",
      content: {
        "application/json": {
          schema: {
            oneOf: [
              { type: "object", additionalProperties: true },
              { type: "array", items: { type: "object", additionalProperties: true } },
              { type: "string" },
              { type: "null" },
            ],
          },
        },
      },
    },
    400: { description: "Bad Request" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
    404: { description: "Not Found" },
  };
}

const paths = {};

for (const route of routeDefinitions) {
  const routeMeta = routeManifest.find(
    (item) => item.path === route.path && item.method === route.method,
  );
  const openapiPath = pathToOpenApi(route.path);
  const parameters = getPathParamNames(route.path).map((name) => ({
    name,
    in: "path",
    required: true,
    schema: { type: "string" },
  }));

  if (!paths[openapiPath]) {
    paths[openapiPath] = {};
  }

  paths[openapiPath][route.method.toLowerCase()] = {
    tags: [routeMeta.tag],
    operationId: routeMeta.operationId,
    summary: `${route.method} ${route.path}`,
    parameters,
    requestBody: buildRequestBody(routeMeta),
    responses: buildResponses(route),
    security: buildSecurity(route),
  };
}

module.exports = {
  openapi: "3.0.0",
  info: {
    title: "Temporary Staffing Platform API",
    version: "1.0.0",
    description:
      "Generated API contract for the CSC309 temporary staffing platform.",
  },
  servers: [
    {
      url: process.env.PUBLIC_BACKEND_URL || "http://localhost:3000",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  paths,
};
