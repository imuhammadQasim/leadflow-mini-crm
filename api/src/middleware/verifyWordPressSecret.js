const crypto = require("crypto");
const ApiError = require("../utils/ApiError");

// The WordPress plugin isn't a logged-in admin, so it can't use the JWT flow.
// Instead it sends a shared secret (configured in both WP admin settings and
// this API's .env) as an "x-api-key" header. This is the "secure endpoint to
// receive WordPress leads" requirement - simple, but keeps the intake route
// from being publicly writable by anyone who finds the URL.
function verifyWordPressSecret(req, res, next) {
  const provided = req.headers["x-api-key"];
  const expected = process.env.WORDPRESS_API_SECRET;

  if (!expected) {
    return next(new Error("WORDPRESS_API_SECRET is not configured on the server"));
  }

  if (
    !provided ||
    provided.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
  ) {
    return next(ApiError.unauthorized("Invalid API key"));
  }

  next();
}

module.exports = verifyWordPressSecret;
