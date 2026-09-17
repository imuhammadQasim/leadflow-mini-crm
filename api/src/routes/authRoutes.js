const express = require("express");
const { login } = require("../controllers/authController");
const { loginValidators } = require("../validators/authValidators");
const validate = require("../middleware/validate");

const router = express.Router();

router.post("/login", loginValidators, validate, login);

module.exports = router;
