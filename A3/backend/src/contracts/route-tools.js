function capitalize(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function segmentToPascal(segment) {
  const raw = segment.replace(/^:/, "");
  return raw
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((part) => capitalize(part))
    .join("");
}

function createOperationId(method, routePath) {
  const segments = routePath.split("/").filter(Boolean);
  return method.toLowerCase() + segments.map(segmentToPascal).join("");
}

function getPathParamNames(routePath) {
  return routePath
    .split("/")
    .filter((segment) => segment.startsWith(":"))
    .map((segment) => segment.slice(1));
}

function pathToOpenApi(routePath) {
  return routePath.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
}

function guessTag(routePath) {
  const [firstSegment] = routePath.split("/").filter(Boolean);
  if (!firstSegment) return "General";
  return firstSegment
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((part) => capitalize(part))
    .join(" ");
}

function usesMultipart(route) {
  return /\/(avatar|resume|document)$/.test(route.path);
}

function createRouteManifest(routes) {
  return routes.map((route) => {
    const multipart = usesMultipart(route);

    return {
      path: route.path,
      openapiPath: pathToOpenApi(route.path),
      method: route.method,
      operationId: createOperationId(route.method, route.path),
      tag: guessTag(route.path),
      pathParams: getPathParamNames(route.path),
      bodyKind: multipart ? "multipart" : ["POST", "PATCH", "PUT"].includes(route.method) ? "json" : null,
      multipartFileField: multipart ? "file" : null,
    };
  });
}

module.exports = {
  createOperationId,
  createRouteManifest,
  getPathParamNames,
  guessTag,
  pathToOpenApi,
  usesMultipart,
};
