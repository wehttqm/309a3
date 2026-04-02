const checkRoleBusiness = async (req, res, next) => {
  if (req.auth && req.auth.role === "business") {
    next();
  } else {
    return res.status(403).json({});
  }
};

module.exports = { checkRoleBusiness };
