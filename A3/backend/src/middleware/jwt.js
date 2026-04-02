const { expressjwt: jwt } = require("express-jwt");

const strictAuth = jwt({
  secret: "secret",
  algorithms: ["HS256"],
  requestProperty: "auth", // Decoded JWT will be at req.auth
});

const optionalAuth = jwt({
  secret: "secret",
  algorithms: ["HS256"],
  requestProperty: "auth",
  credentialsRequired: false,
});

module.exports = { strictAuth, optionalAuth };
