const express = require("express");
const verifyWordPressSecret = require("../middleware/verifyWordPressSecret");
const validate = require("../middleware/validate");
const { wordpressLeadValidators } = require("../validators/leadValidators");
const { receiveWordPressLead } = require("../controllers/leadController");

const router = express.Router();

// Not protected by admin JWT (WordPress has no admin session) - protected
// instead by the shared x-api-key secret, see middleware/verifyWordPressSecret.js
router.post("/leads", verifyWordPressSecret, wordpressLeadValidators, validate, receiveWordPressLead);

module.exports = router;
