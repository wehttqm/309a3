"use strict";

require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const openapiSpec = require("./docs/openapi");
const { addRoute } = require("./utils/add_route.js");
const { routeDefinitions } = require("./routes/registry.js");
const { middlewareMap } = require("./middleware/map.js");

function create_app() {
  const app = express();
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ].filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`CORS blocked for origin: ${origin}`));
      },
    }),
  );
  app.use(express.json());
  app.use("/uploads", express.static(path.resolve("uploads")));

  for (const route of routeDefinitions) {
    const middlewares = route.middlewareIds.map((id) => middlewareMap[id]);
    addRoute(app, route.path, route.method, ...middlewares);
  }

  //add a flag for prod
  app.get("/openapi.json", (req, res) => {
    res.json(openapiSpec);
  });

  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(openapiSpec, {
      explorer: true,
    }),
  );

  app.use((req, res, next) => {
    const pathIsRegistered = app._router.stack.some((layer) => {
      if (layer.route) return layer.route.path === req.path;
      return false;
    });

    if (pathIsRegistered) {
      return res.status(405).json({ error: "Method Not Allowed" });
    }
    next(); // Move to 404 if path doesn't exist at all
  });

  app.use((req, res) => {
    res.status(404).json({ error: "Not Found" });
  });

  return app;
}

module.exports = { create_app };
