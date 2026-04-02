const fs = require("fs");
const path = require("path");
const openapi = require("../src/docs/openapi.js");
const { routeDefinitions } = require("../src/routes/registry.js");
const { createRouteManifest } = require("../src/contracts/route-tools.js");

const rootDir = path.join(__dirname, "..");
const manifestPath = path.join(rootDir, "route-manifest.json");
const openapiPath = path.join(rootDir, "openapi.generated.json");

const manifest = createRouteManifest(routeDefinitions);

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
fs.writeFileSync(openapiPath, JSON.stringify(openapi, null, 2));

console.log(`Wrote ${manifestPath}`);
console.log(`Wrote ${openapiPath}`);
