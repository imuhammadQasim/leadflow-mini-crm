import { getScoreTier } from "../../utils/formatters";

// Shows the numeric score plus a Hot/Warm/Cold tier so it reads at a glance
// in a table, not just as a bare number.
export default function LeadScoreBadge({ score }) {
  const tier = getScoreTier(score);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${tier.classes}`}
      title={`Lead Score: ${score}/100`}
    >
      {score}
      <span className="font-normal opacity-80">· {tier.label}</span>
    </span>
  );
}
