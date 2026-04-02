const checkRoleAdmin = async (req, res, next) => {
  if (req.auth && req.auth.role === "admin") {
    next();
  } else {
    return res.status(403).json({});
  }
};

module.exports = { checkRoleAdmin };
