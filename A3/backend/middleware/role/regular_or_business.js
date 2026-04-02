const checkRoleRegularOrBusiness = async (req, res, next) => {
  if (
    req.auth &&
    (req.auth.role === "regular" || req.auth.role === "business")
  ) {
    next();
  } else {
    return res.status(403).json({});
  }
};

module.exports = { checkRoleRegularOrBusiness };
