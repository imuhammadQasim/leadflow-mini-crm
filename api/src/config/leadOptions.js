// Single source of truth for the fixed option lists used by the Lead model,
// request validators, and the lead scoring logic. Keeping them here means the
// scoring rules in utils/leadScore.js can map directly against these values.

const LEAD_STATUSES = ["New", "Contacted", "Qualified", "Won", "Lost"];

// Budget is collected as a fixed range rather than free text so it can be
// scored consistently (a free-text "around 5k maybe" is not reliably parseable).
const BUDGET_RANGES = ["under_1k", "1k_5k", "5k_10k", "10k_25k", "25k_plus"];

const SERVICES = [
  "Web Development",
  "Branding",
  "Digital Marketing",
  "SEO",
  "Consulting",
  "Other",
];

const SOURCES = ["website", "referral", "organic", "ads", "social", "other"];

module.exports = { LEAD_STATUSES, BUDGET_RANGES, SERVICES, SOURCES };
