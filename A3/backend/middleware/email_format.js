const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email, res, next) {
  if (!email_regex.test(email)) {
    return res.status(400).json({
      error: "Invalid email format.",
    });
  }
  next();
}

const emailFormatStrict = (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  return validateEmail(email, res, next);
};

const emailFormatOptional = (req, res, next) => {
  const { email } = req.body;

  if (email === undefined || email === null) {
    return next();
  }

  return validateEmail(email, res, next);
};

module.exports = { emailFormatStrict, emailFormatOptional };
