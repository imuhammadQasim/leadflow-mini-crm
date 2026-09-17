const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");

// Protects private CRM endpoints (leads CRUD, stats). Expects
// "Authorization: Bearer <token>" issued by POST /api/auth/login.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(ApiError.unauthorized("Missing or malformed Authorization header"));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    next(ApiError.unauthorized("Invalid or expired token"));
  }
}

module.exports = requireAuth;
