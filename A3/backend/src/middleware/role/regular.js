const checkRoleRegular = async (req, res, next) => {
  if (req.auth && req.auth.role === "regular") {
    next();
  } else {
    console.log("asdf");
    return res.status(403).json({});
  }
};

module.exports = { checkRoleRegular };
