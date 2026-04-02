// Strict regex for YYYY-MM-DD
const birthday_regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

function validateBirthday(birthday, res, next) {
  if (!birthday_regex.test(birthday)) {
    return res.status(400).json({
      error: "Birthday must be in ISO 8601 Format: YYYY-MM-DD",
    });
  }
  next();
}

const birthdayFormatStrict = (req, res, next) => {
  const { birthday } = req.body;

  if (!birthday) {
    return res.status(400).json({ error: "Birthday is required." });
  }

  return validateBirthday(birthday, res, next);
};

const birthdayFormatOptional = (req, res, next) => {
  const { birthday } = req.body;

  if (birthday === undefined || birthday === null) {
    return next();
  }

  return validateBirthday(birthday, res, next);
};

module.exports = { birthdayFormatStrict, birthdayFormatOptional };
