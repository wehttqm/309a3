const { updateLastActive } = require("./update_last_active.js");
const { rateLimiter } = require("./rate-limiter.js");
const {
  passwordRegexOptional,
  passwordRegexStrict,
} = require("./password_regex.js");
const { strictAuth, optionalAuth } = require("./jwt.js");
const { birthdayFormatOptional } = require("./birthday_format.js");
const { emailFormatStrict } = require("./email_format.js");
const { locationStrict, locationOptional } = require("./lat_lon_range.js");
const { checkRoleBusiness } = require("./role/business.js");
const { checkRoleAdmin } = require("./role/admin.js");
const { checkRoleRegular } = require("./role/regular.js");
const {
  uploadQualificationDocument,
  uploadBusinessAvatar,
  uploadUserAvatar,
  uploadUserResume,
} = require("./upload.js");
const {
  checkRoleRegularOrBusiness,
} = require("./role/regular_or_business.js");

const middlewareMap = {
  updateLastActive,
  rateLimiter,
  passwordRegexOptional,
  passwordRegexStrict,
  strictAuth,
  optionalAuth,
  birthdayFormatOptional,
  emailFormatStrict,
  locationStrict,
  locationOptional,
  checkRoleBusiness,
  checkRoleAdmin,
  checkRoleRegular,
  uploadQualificationDocument,
  uploadBusinessAvatar,
  uploadUserAvatar,
  uploadUserResume,
  checkRoleRegularOrBusiness,
};

module.exports = { middlewareMap };
