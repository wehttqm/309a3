function defineRoute(path, method, ...middlewareIds) {
  return {
    path,
    method,
    middlewareIds,
  };
}

const routeDefinitions = [
  // System
  defineRoute("/system/reset-cooldown", "GET", "strictAuth", "checkRoleAdmin"),
  defineRoute("/system/reset-cooldown", "PATCH", "strictAuth", "checkRoleAdmin"),
  defineRoute(
    "/system/availability-timeout",
    "GET",
    "strictAuth",
    "checkRoleAdmin",
  ),
  defineRoute(
    "/system/availability-timeout",
    "PATCH",
    "strictAuth",
    "checkRoleAdmin",
  ),
  defineRoute(
    "/system/job-start-window",
    "GET",
    "strictAuth",
    "checkRoleAdmin",
  ),
  defineRoute(
    "/system/job-start-window",
    "PATCH",
    "strictAuth",
    "checkRoleAdmin",
  ),
  defineRoute(
    "/system/negotiation-window",
    "GET",
    "strictAuth",
    "checkRoleAdmin",
  ),
  defineRoute(
    "/system/negotiation-window",
    "PATCH",
    "strictAuth",
    "checkRoleAdmin",
  ),

  // Auth
  defineRoute("/auth/resets/:resetToken", "POST", "passwordRegexOptional"),
  defineRoute("/auth/resets", "POST", "rateLimiter"),
  defineRoute("/auth/tokens", "POST"),

  // Users
  defineRoute(
    "/users",
    "POST",
    "passwordRegexStrict",
    "birthdayFormatOptional",
    "emailFormatStrict",
  ),
  defineRoute("/users", "GET", "strictAuth", "checkRoleAdmin", "updateLastActive"),
  defineRoute("/users/me", "GET", "strictAuth", "checkRoleRegular"),
  defineRoute("/users/me/dashboard", "GET", "strictAuth", "checkRoleRegular", "updateLastActive"),
  defineRoute(
    "/users/me/avatar",
    "PUT",
    "strictAuth",
    "checkRoleRegularOrBusiness",
    "uploadUserAvatar",
    "updateLastActive",
  ),
  defineRoute(
    "/users/me/resume",
    "PUT",
    "strictAuth",
    "checkRoleRegularOrBusiness",
    "uploadUserResume",
    "updateLastActive",
  ),
  defineRoute(
    "/users/:userId/suspended",
    "PATCH",
    "strictAuth",
    "checkRoleAdmin",
  ),
  defineRoute(
    "/users/me",
    "PATCH",
    "strictAuth",
    "checkRoleRegular",
    "birthdayFormatOptional",
    "updateLastActive",
  ),
  defineRoute("/users/me/available", "PATCH", "strictAuth", "checkRoleRegular", "updateLastActive"),
  defineRoute("/users/me/invitations", "GET", "strictAuth", "checkRoleRegular", "updateLastActive"),
  defineRoute("/users/me/interests", "GET", "strictAuth", "checkRoleRegular", "updateLastActive"),
  defineRoute("/users/me/jobs", "GET", "strictAuth", "checkRoleRegular", "updateLastActive"),
  defineRoute("/users/me/qualifications", "GET", "strictAuth", "checkRoleRegular", "updateLastActive"),

  // Businesses
  defineRoute(
    "/businesses",
    "POST",
    "passwordRegexStrict",
    "emailFormatStrict",
    "locationStrict",
  ),
  defineRoute("/businesses", "GET", "optionalAuth"),
  defineRoute("/businesses/me", "GET", "strictAuth", "checkRoleBusiness"),
  defineRoute("/businesses/me/dashboard", "GET", "strictAuth", "checkRoleBusiness"),
  defineRoute("/businesses/me", "PATCH", "strictAuth", "locationOptional"),
  defineRoute("/businesses/me/jobs", "GET", "strictAuth", "checkRoleBusiness"),
  defineRoute("/businesses/me/jobs", "POST", "strictAuth", "checkRoleBusiness"),
  defineRoute(
    "/businesses/me/jobs/:jobId",
    "PATCH",
    "strictAuth",
    "checkRoleBusiness",
  ),
  defineRoute(
    "/businesses/me/jobs/:jobId",
    "DELETE",
    "strictAuth",
    "checkRoleBusiness",
  ),
  defineRoute(
    "/businesses/me/avatar",
    "PUT",
    "strictAuth",
    "checkRoleRegularOrBusiness",
    "uploadBusinessAvatar",
  ),
  defineRoute("/businesses/:businessId", "GET", "optionalAuth"),
  defineRoute(
    "/businesses/:businessId/verified",
    "PATCH",
    "strictAuth",
    "checkRoleAdmin",
  ),

  // Position Types
  defineRoute("/position-types", "POST", "strictAuth", "checkRoleAdmin"),
  defineRoute("/position-types", "GET", "strictAuth", "updateLastActive"),
  defineRoute(
    "/position-types/:positionTypeId",
    "PATCH",
    "strictAuth",
    "checkRoleAdmin",
  ),
  defineRoute(
    "/position-types/:positionTypeId",
    "DELETE",
    "strictAuth",
    "checkRoleAdmin",
  ),

  // Qualifications
  defineRoute("/qualifications", "GET", "strictAuth", "checkRoleAdmin"),
  defineRoute("/qualifications", "POST", "strictAuth", "checkRoleRegular", "updateLastActive"),
  defineRoute("/qualifications/:qualificationId", "GET", "strictAuth", "updateLastActive"),
  defineRoute("/qualifications/:qualificationId", "PATCH", "strictAuth", "updateLastActive"),
  defineRoute(
    "/qualifications/:qualificationId/document",
    "PUT",
    "strictAuth",
    "checkRoleRegularOrBusiness",
    "uploadQualificationDocument",
    "updateLastActive",
  ),

  // Jobs
  defineRoute("/jobs", "GET", "strictAuth", "checkRoleRegular", "updateLastActive"),
  defineRoute("/jobs/:jobId", "GET", "strictAuth", "checkRoleRegularOrBusiness", "updateLastActive"),
  defineRoute("/jobs/:jobId/no-show", "PATCH", "strictAuth", "checkRoleBusiness"),
  defineRoute("/jobs/:jobId/interested", "PATCH", "strictAuth", "checkRoleRegular", "updateLastActive"),
  defineRoute("/jobs/:jobId/interests", "GET", "strictAuth", "checkRoleBusiness"),
  defineRoute("/jobs/:jobId/candidates", "GET", "strictAuth", "checkRoleBusiness"),
  defineRoute(
    "/jobs/:jobId/candidates/:userId",
    "GET",
    "strictAuth",
    "checkRoleBusiness",
  ),
  defineRoute(
    "/jobs/:jobId/candidates/:userId/interested",
    "PATCH",
    "strictAuth",
    "checkRoleBusiness",
  ),

  // Negotiations
  defineRoute("/negotiations", "POST", "strictAuth", "checkRoleRegularOrBusiness", "updateLastActive"),
  defineRoute(
    "/negotiations/me",
    "GET",
    "strictAuth",
    "checkRoleRegularOrBusiness",
    "updateLastActive",
  ),
  defineRoute(
    "/negotiations/me/decision",
    "PATCH",
    "strictAuth",
    "checkRoleRegularOrBusiness",
    "updateLastActive",
  ),
];

module.exports = {
  routeDefinitions,
};
