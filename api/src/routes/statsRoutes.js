const express = require("express");
const requireAuth = require("../middleware/auth");
const { getStats } = require("../controllers/statsController");

const router = express.Router();

router.use(requireAuth);
router.get("/", getStats);

module.exports = router;
