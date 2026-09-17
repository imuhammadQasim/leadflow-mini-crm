// Mirrors api/src/config/leadOptions.js - kept in sync manually since the
// frontend and backend are separate deployables here. If these drift, the
// API's own 400 validation errors are still the source of truth.

export const LEAD_STATUSES = ["New", "Contacted", "Qualified", "Won", "Lost"];

export const BUDGET_RANGES = [
  { value: "under_1k", label: "Under $1,000" },
  { value: "1k_5k", label: "$1,000 - $5,000" },
  { value: "5k_10k", label: "$5,000 - $10,000" },
  { value: "10k_25k", label: "$10,000 - $25,000" },
  { value: "25k_plus", label: "$25,000+" },
];

export const SERVICES = [
  "Web Development",
  "Branding",
  "Digital Marketing",
  "SEO",
  "Consulting",
  "Other",
];

export const SOURCES = ["website", "referral", "organic", "ads", "social", "other"];

export const STATUS_STYLES = {
  New: "bg-blue-100 text-blue-700 ring-blue-600/20",
  Contacted: "bg-amber-100 text-amber-700 ring-amber-600/20",
  Qualified: "bg-purple-100 text-purple-700 ring-purple-600/20",
  Won: "bg-green-100 text-green-700 ring-green-600/20",
  Lost: "bg-slate-200 text-slate-600 ring-slate-500/20",
};
