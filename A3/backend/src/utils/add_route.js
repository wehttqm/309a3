const path = require("path");
const ROUTES_PATH = path.join(process.cwd(), "./src/routes");

/**
 * A helper that makes it really easy to get your route handler
 * @param path      the route you would pass to express, ex. "/users/:userId"
 * @param method    the http method, ex. "GET"
 */
function getHandler(path, method) {
  const module = require(ROUTES_PATH + path + "/route.js");
  return module[method];
}

/**
 * A helper that attaches a route to your express app.
 * @param app       the express() instance
 * @param path      the route you would pass to express, ex. "/users/:userId"
 * @param method    the http method, ex. "GET"
 */
function addRoute(app, path, method, ...handlers) {
  const finalRouteHandler = getHandler(path, method);
  app[method.toLowerCase()](path, ...handlers, finalRouteHandler);
}

module.exports = { addRoute };
