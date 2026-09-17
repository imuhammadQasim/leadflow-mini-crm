import { BUDGET_RANGES } from "../constants/leadOptions";

export function formatBudgetRange(value) {
  return BUDGET_RANGES.find((b) => b.value === value)?.label || value;
}

export function formatDate(isoString) {
  if (!isoString) return "-";
  return new Date(isoString).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Lead Score display tier. Thresholds are a simple triage convention (not
 * part of the scoring formula itself): 70+ is worth calling today, 40-69 is
 * worth following up on, under 40 is low priority. Purely a UI grouping.
 */
export function getScoreTier(score) {
  if (score >= 70) return { label: "Hot", classes: "bg-red-100 text-red-700 ring-red-600/20" };
  if (score >= 40) return { label: "Warm", classes: "bg-amber-100 text-amber-700 ring-amber-600/20" };
  return { label: "Cold", classes: "bg-slate-100 text-slate-600 ring-slate-500/20" };
}
