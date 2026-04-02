const password_regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,20}$/;

function validatePassword(password, res, next) {
  if (!password_regex.test(password)) {
    return res.status(400).json({
      error:
        "Password must be 8-20 characters and include uppercase, lowercase, number, and special character",
    });
  }
  next();
}

function passwordRegexStrict(req, res, next) {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Password is required." });
  }

  return validatePassword(password, res, next);
}

function passwordRegexOptional(req, res, next) {
  const { password } = req.body;

  if (password === undefined || password === null) {
    return next();
  }

  return validatePassword(password, res, next);
}

module.exports = { passwordRegexStrict, passwordRegexOptional };
