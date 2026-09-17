const { body, query, param } = require("express-validator");
const {
  LEAD_STATUSES,
  BUDGET_RANGES,
  SERVICES,
  SOURCES,
} = require("../config/leadOptions");

// Shared by both the public WordPress intake and the manual "create lead"
// endpoint, since both create the same kind of document.
const leadFieldRules = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 120 }),
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone is required")
    .custom((value) => value.replace(/\D/g, "").length >= 7)
    .withMessage("Phone number looks too short"),
  body("service").isIn(SERVICES).withMessage(`Service must be one of: ${SERVICES.join(", ")}`),
  body("budgetRange")
    .isIn(BUDGET_RANGES)
    .withMessage(`Budget range must be one of: ${BUDGET_RANGES.join(", ")}`),
  body("message").trim().notEmpty().withMessage("Message is required").isLength({ max: 2000 }),
  body("source").optional().isIn(SOURCES).withMessage(`Source must be one of: ${SOURCES.join(", ")}`),
];

// WordPress never sends a leadScore - it's calculated server-side for that path.
const wordpressLeadValidators = leadFieldRules;

// Manual creation from the dashboard: same base fields, plus an
// admin-entered leadScore (see leadController.createLead for why this isn't
// auto-calculated here).
const createLeadValidators = [
  ...leadFieldRules,
  body("leadScore")
    .isInt({ min: 0, max: 100 })
    .withMessage("Lead score must be an integer between 0 and 100")
    .toInt(),
];

const updateLeadValidators = [
  param("id").isMongoId().withMessage("Invalid lead id"),
  body("name").optional().trim().notEmpty().isLength({ max: 120 }),
  body("email").optional().trim().isEmail().normalizeEmail(),
  body("phone")
    .optional()
    .trim()
    .custom((value) => value.replace(/\D/g, "").length >= 7)
    .withMessage("Phone number looks too short"),
  body("service").optional().isIn(SERVICES),
  body("budgetRange").optional().isIn(BUDGET_RANGES),
  body("message").optional().trim().isLength({ max: 2000 }),
  body("source").optional().isIn(SOURCES),
  body("status")
    .optional()
    .isIn(LEAD_STATUSES)
    .withMessage(`Status must be one of: ${LEAD_STATUSES.join(", ")}`),
  body("leadScore")
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage("Lead score must be an integer between 0 and 100")
    .toInt(),
];

const idParamValidator = [param("id").isMongoId().withMessage("Invalid lead id")];

const listLeadsValidators = [
  query("status").optional().isIn(LEAD_STATUSES),
  query("q").optional().trim().isLength({ max: 200 }),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
];

module.exports = {
  createLeadValidators,
  wordpressLeadValidators,
  updateLeadValidators,
  idParamValidator,
  listLeadsValidators,
};
