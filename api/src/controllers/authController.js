const jwt = require("jsonwebtoken");
const AdminUser = require("../models/AdminUser");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const admin = await AdminUser.findOne({ email });
  const passwordMatches = admin ? await admin.comparePassword(password) : false;

  // Same error for "no such user" and "wrong password" so the endpoint
  // doesn't leak which admin emails exist.
  if (!admin || !passwordMatches) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const token = jwt.sign(
    { sub: admin._id.toString(), email: admin.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );

  res.json({
    success: true,
    data: { token, admin: { id: admin._id, email: admin.email } },
  });
});

module.exports = { login };
