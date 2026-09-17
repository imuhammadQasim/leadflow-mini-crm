const express = require("express");
const requireAuth = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  createLeadValidators,
  updateLeadValidators,
  idParamValidator,
  listLeadsValidators,
} = require("../validators/leadValidators");
const {
  createLead,
  listLeads,
  getLead,
  updateLead,
  deleteLead,
} = require("../controllers/leadController");

const router = express.Router();

// Every route below is a private CRM endpoint - require a valid admin JWT.
router.use(requireAuth);

router.get("/", listLeadsValidators, validate, listLeads);
router.post("/", createLeadValidators, validate, createLead);
router.get("/:id", idParamValidator, validate, getLead);
router.patch("/:id", updateLeadValidators, validate, updateLead);
router.delete("/:id", idParamValidator, validate, deleteLead);

module.exports = router;
