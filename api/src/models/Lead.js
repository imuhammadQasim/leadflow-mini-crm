const mongoose = require("mongoose");
const {
  LEAD_STATUSES,
  BUDGET_RANGES,
  SERVICES,
  SOURCES,
} = require("../config/leadOptions");

// Duplicate-prevention window: how long after a lead comes in do we treat a
// second submission with the same contact details as "the same enquiry"
// rather than a genuinely new one. 24 hours covers the realistic case this
// is meant to catch - a visitor double-clicking submit, or WordPress retrying
// the sync after a slow/failed API response - without blocking a returning
// visitor who fills the form again next week.
const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
    },
    phone: { type: String, required: true, trim: true },
    // Digits-only copy of the phone number, used for duplicate lookups and
    // indexed for that lookup. Formatting like "+1 (555) 123-4567" vs
    // "5551234567" would otherwise make an exact-match query miss obvious dupes.
    phoneDigits: { type: String, trim: true, index: true },
    service: { type: String, required: true, enum: SERVICES },
    budgetRange: { type: String, required: true, enum: BUDGET_RANGES },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: LEAD_STATUSES,
      default: "New",
    },
    source: {
      type: String,
      enum: SOURCES,
      default: "website",
    },
    leadScore: { type: Number, min: 0, max: 100, default: 0 },
    // Set when the lead arrives through the public WordPress intake endpoint,
    // so the dashboard can distinguish auto-synced leads from ones a staff
    // member added manually.
    createdVia: {
      type: String,
      enum: ["wordpress", "manual"],
      default: "manual",
    },
  },
  { timestamps: true }
);

leadSchema.index({ email: 1, createdAt: -1 });
leadSchema.index({ name: "text", email: "text", message: "text" });

leadSchema.pre("validate", function stripPhoneToDigits(next) {
  if (this.phone) {
    this.phoneDigits = this.phone.replace(/\D/g, "");
  }
  next();
});

/**
 * Looks up an existing lead that counts as a duplicate of the given contact
 * details: same email OR same phone number, created within the last 24h.
 * Either signal on its own is a strong indicator of a resubmitted form.
 */
leadSchema.statics.findRecentDuplicate = function findRecentDuplicate({
  email,
  phone,
}) {
  const phoneDigits = phone ? phone.replace(/\D/g, "") : undefined;
  const since = new Date(Date.now() - DUPLICATE_WINDOW_MS);

  const orConditions = [{ email: email.toLowerCase().trim() }];
  if (phoneDigits) {
    orConditions.push({ phoneDigits });
  }

  return this.findOne({
    createdAt: { $gte: since },
    $or: orConditions,
  });
};

module.exports = mongoose.model("Lead", leadSchema);
