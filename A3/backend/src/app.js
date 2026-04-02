"use strict";

const express = require("express");
const cors = require("cors");
const { expressjwt: jwt } = require("express-jwt");
const { addRoute } = require("./utils/add_route.js");
const { updateLastActive } = require("./middleware/update_last_active.js");
const { rateLimiter } = require("./middleware/rate-limiter.js");
const {
  passwordRegexOptional,
  passwordRegexStrict,
} = require("./middleware/password_regex.js");
const { strictAuth, optionalAuth } = require("./middleware/jwt.js");
const { birthdayFormatOptional } = require("./middleware/birthday_format.js");
const { emailFormatStrict } = require("./middleware/email_format.js");
const {
  locationStrict,
  locationOptional,
} = require("./middleware/lat_lon_range.js");
const { checkRoleBusiness } = require("./middleware/role/business.js");
const { checkRoleAdmin } = require("./middleware/role/admin.js");
const { checkRoleRegular } = require("./middleware/role/regular.js");
const {
  uploadMiddleware,
  uploadQualificationDocument,
  uploadBusinessAvatar,
  uploadUserAvatar,
  uploadUserResume,
} = require("./middleware/upload.js");
const {
  checkRoleRegularOrBusiness,
} = require("./middleware/role/regular_or_business.js");

function create_app() {
  const app = express();
    const allowedOrigins = [
    process.env.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ].filter(Boolean);

  app.use(cors({ allowedOrigins}));
  app.use(express.json());

  // System
  addRoute(app, "/system/reset-cooldown", "PATCH", strictAuth, checkRoleAdmin);
  addRoute(
    app,
    "/system/availability-timeout",
    "PATCH",
    strictAuth,
    checkRoleAdmin,
  );
  addRoute(
    app,
    "/system/job-start-window",
    "PATCH",
    strictAuth,
    checkRoleAdmin,
  );
  addRoute(
    app,
    "/system/negotiation-window",
    "PATCH",
    strictAuth,
    checkRoleAdmin,
  );

  // Auth
  addRoute(app, "/auth/resets/:resetToken", "POST", passwordRegexOptional);
  addRoute(app, "/auth/resets", "POST", rateLimiter);
  addRoute(app, "/auth/tokens", "POST");

  // Users
  addRoute(
    app,
    "/users",
    "POST",
    passwordRegexStrict,
    birthdayFormatOptional,
    emailFormatStrict,
  );
  addRoute(app, "/users", "GET", strictAuth, checkRoleAdmin, updateLastActive);
  addRoute(app, "/users/me", "GET", strictAuth, checkRoleRegular);
  addRoute(
    app,
    "/users/me/avatar",
    "PUT",
    strictAuth,
    checkRoleRegularOrBusiness,
    uploadUserAvatar,
  );
  addRoute(
    app,
    "/users/me/resume",
    "PUT",
    strictAuth,
    checkRoleRegularOrBusiness,
    uploadUserResume,
  );
  addRoute(
    app,
    "/users/:userId/suspended",
    "PATCH",
    strictAuth,
    checkRoleAdmin,
  );
  addRoute(app, "/users/me", "GET", strictAuth, checkRoleRegular);
  addRoute(
    app,
    "/users/me",
    "PATCH",
    strictAuth,
    checkRoleRegular,
    birthdayFormatOptional,
  );
  addRoute(app, "/users/me/available", "PATCH", strictAuth, checkRoleRegular);
  addRoute(app, "/users/me/invitations", "GET", strictAuth, checkRoleRegular);
  addRoute(app, "/users/me/interests", "GET", strictAuth, checkRoleRegular);

  // Businesses
  addRoute(
    app,
    "/businesses",
    "POST",
    passwordRegexStrict,
    emailFormatStrict,
    locationStrict,
  );
  addRoute(app, "/businesses", "GET", optionalAuth);
  addRoute(app, "/businesses/me", "GET", strictAuth, checkRoleBusiness);
  addRoute(app, "/businesses/me", "PATCH", strictAuth, locationOptional);
  addRoute(app, "/businesses/me/jobs", "GET", strictAuth, checkRoleBusiness);
  addRoute(app, "/businesses/me/jobs", "POST", strictAuth, checkRoleBusiness);
  addRoute(
    app,
    "/businesses/me/jobs/:jobId",
    "PATCH",
    strictAuth,
    checkRoleBusiness,
  );
  addRoute(
    app,
    "/businesses/me/jobs/:jobId",
    "DELETE",
    strictAuth,
    checkRoleBusiness,
  );
  addRoute(
    app,
    "/businesses/me/avatar",
    "PUT",
    strictAuth,
    checkRoleRegularOrBusiness,
    uploadBusinessAvatar,
  );
  addRoute(app, "/businesses/:businessId", "GET", optionalAuth);
  addRoute(
    app,
    "/businesses/:businessId/verified",
    "PATCH",
    strictAuth,
    checkRoleAdmin,
  );

  // Position Types
  addRoute(app, "/position-types", "POST", strictAuth, checkRoleAdmin);
  addRoute(app, "/position-types", "GET", strictAuth);
  addRoute(
    app,
    "/position-types/:positionTypeId",
    "PATCH",
    strictAuth,
    checkRoleAdmin,
  );
  addRoute(
    app,
    "/position-types/:positionTypeId",
    "DELETE",
    strictAuth,
    checkRoleAdmin,
  );

  // Qualifications
  addRoute(app, "/qualifications", "GET", strictAuth, checkRoleAdmin);
  addRoute(app, "/qualifications", "POST", strictAuth, checkRoleRegular);
  addRoute(app, "/qualifications/:qualificationId", "GET", strictAuth);
  addRoute(app, "/qualifications/:qualificationId", "PATCH", strictAuth);
  addRoute(
    app,
    "/qualifications/:qualificationId/document",
    "PUT",
    strictAuth,
    checkRoleRegularOrBusiness,
    uploadQualificationDocument,
  );

  // Jobs
  addRoute(app, "/jobs", "GET", strictAuth, checkRoleRegular);
  addRoute(app, "/jobs/:jobId", "GET", strictAuth, checkRoleRegularOrBusiness);
  addRoute(app, "/jobs/:jobId/no-show", "PATCH", strictAuth, checkRoleBusiness);
  addRoute(
    app,
    "/jobs/:jobId/interested",
    "PATCH",
    strictAuth,
    checkRoleRegular,
  );
  addRoute(app, "/jobs/:jobId/interests", "GET", strictAuth, checkRoleBusiness);
  addRoute(
    app,
    "/jobs/:jobId/candidates",
    "GET",
    strictAuth,
    checkRoleBusiness,
  );
  addRoute(
    app,
    "/jobs/:jobId/candidates/:userId",
    "GET",
    strictAuth,
    checkRoleBusiness,
  );
  addRoute(
    app,
    "/jobs/:jobId/candidates/:userId/interested",
    "PATCH",
    strictAuth,
    checkRoleBusiness,
  );

  // Negotiations
  addRoute(
    app,
    "/negotiations",
    "POST",
    strictAuth,
    checkRoleRegularOrBusiness,
  );
  addRoute(
    app,
    "/negotiations/me",
    "GET",
    strictAuth,
    checkRoleRegularOrBusiness,
  );
  addRoute(
    app,
    "/negotiations/me/decision",
    "PATCH",
    strictAuth,
    checkRoleRegularOrBusiness,
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
