const { expressjwt: jwt } = require("express-jwt");

const SECRET = process.env.JWT_SECRET || "secret";

const strictAuth = jwt({
  secret: SECRET,
  algorithms: ["HS256"],
  requestProperty: "auth",
});

const optionalAuth = jwt({
  secret: SECRET,
  algorithms: ["HS256"],
  requestProperty: "auth",
  credentialsRequired: false,
});

module.exports = { strictAuth, optionalAuth };
