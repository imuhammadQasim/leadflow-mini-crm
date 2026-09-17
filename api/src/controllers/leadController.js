const Lead = require("../models/Lead");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { calculateLeadScore } = require("../utils/leadScore");

const LEAD_INPUT_FIELDS = [
  "name",
  "email",
  "phone",
  "service",
  "budgetRange",
  "message",
  "source",
];

function pickLeadInput(body) {
  return LEAD_INPUT_FIELDS.reduce((acc, field) => {
    if (body[field] !== undefined) acc[field] = body[field];
    return acc;
  }, {});
}

/**
 * Shared by the manual "create lead" endpoint and the WordPress intake
 * endpoint: runs the duplicate check and saves the lead. Throws
 * ApiError.conflict(409) if a recent duplicate already exists.
 * `leadScore` is passed in rather than computed here, since the two callers
 * source it differently (see createLead vs receiveWordPressLead below).
 */
async function createLeadRecord(input, leadScore, createdVia) {
  const existing = await Lead.findRecentDuplicate({
    email: input.email,
    phone: input.phone,
  });

  if (existing) {
    throw ApiError.conflict(
      "A matching lead was already submitted in the last 24 hours",
      { existingLeadId: existing._id }
    );
  }

  const lead = await Lead.create({ ...input, leadScore, createdVia });
  return lead;
}

// POST /api/leads (protected - manual entry from the dashboard).
// The admin enters the Lead Score directly here rather than having it
// auto-calculated - calculateLeadScore() is only used for the WordPress
// intake path (see receiveWordPressLead below).
const createLead = asyncHandler(async (req, res) => {
  const input = pickLeadInput(req.body);
  const lead = await createLeadRecord(input, req.body.leadScore, "manual");
  res.status(201).json({ success: true, data: lead });
});

// GET /api/leads?status=New&q=text&page=1&limit=20 (protected)
const listLeads = asyncHandler(async (req, res) => {
  const { status, q, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (q) {
    // Case-insensitive partial match across the fields a staff member would
    // realistically search by. A regex is used instead of $text so a search
    // like "gma" still matches "user@gmail.com" (a $text index only matches
    // whole words, which is too strict for this use case).
    const pattern = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: pattern }, { email: pattern }, { message: pattern }];
  }

  const skip = (page - 1) * limit;

  const [leads, total] = await Promise.all([
    Lead.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Lead.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: leads,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// GET /api/leads/:id (protected)
const getLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) throw ApiError.notFound("Lead not found");
  res.json({ success: true, data: lead });
});

// PATCH /api/leads/:id (protected - status changes and general edits)
const updateLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) throw ApiError.notFound("Lead not found");

  const input = pickLeadInput(req.body);
  Object.assign(lead, input);
  if (req.body.status) lead.status = req.body.status;
  // leadScore is admin-entered, same as on manual creation - just accept
  // whatever value is sent rather than recalculating it behind the admin's back.
  if (req.body.leadScore !== undefined) lead.leadScore = req.body.leadScore;

  await lead.save();
  res.json({ success: true, data: lead });
});

// DELETE /api/leads/:id (protected)
const deleteLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findByIdAndDelete(req.params.id);
  if (!lead) throw ApiError.notFound("Lead not found");
  res.json({ success: true, data: { id: req.params.id } });
});

// POST /api/public/leads (secured with the WordPress shared secret, not JWT).
// No admin is involved in this path, so the Lead Score is calculated by
// backend logic here, per the assessment's Logic Challenge requirement.
const receiveWordPressLead = asyncHandler(async (req, res) => {
  const input = pickLeadInput(req.body);
  const leadScore = calculateLeadScore(input);
  const lead = await createLeadRecord(input, leadScore, "wordpress");
  res.status(201).json({ success: true, data: lead });
});

module.exports = {
  createLead,
  listLeads,
  getLead,
  updateLead,
  deleteLead,
  receiveWordPressLead,
};
