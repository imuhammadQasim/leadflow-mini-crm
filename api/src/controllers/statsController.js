const Lead = require("../models/Lead");
const asyncHandler = require("../utils/asyncHandler");
const { LEAD_STATUSES } = require("../config/leadOptions");

// GET /api/stats (protected) - dashboard summary cards + Angular insights view
const getStats = asyncHandler(async (req, res) => {
  const [total, statusAgg, topScored] = await Promise.all([
    Lead.countDocuments(),
    Lead.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Lead.find().sort({ leadScore: -1 }).limit(5).select("name email leadScore status"),
  ]);

  // Make sure every status appears even with zero leads, so the frontend
  // doesn't have to handle missing keys.
  const byStatus = LEAD_STATUSES.reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {});
  statusAgg.forEach(({ _id, count }) => {
    byStatus[_id] = count;
  });

  res.json({
    success: true,
    data: { total, byStatus, topLeadsByScore: topScored },
  });
});

module.exports = { getStats };
