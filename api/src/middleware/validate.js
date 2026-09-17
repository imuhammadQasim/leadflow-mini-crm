const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

// Runs after an express-validator chain array; turns collected errors into
// one consistent 400 response instead of each route handling it separately.
function validate(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return next(
      ApiError.badRequest(
        "Validation failed",
        result.array().map((e) => ({ field: e.path, message: e.msg }))
      )
    );
  }
  next();
}

module.exports = validate;
