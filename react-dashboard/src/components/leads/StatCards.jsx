import { LEAD_STATUSES } from "../../constants/leadOptions";
import LoadingSpinner from "../common/LoadingSpinner";
import ErrorBanner from "../common/ErrorBanner";

export default function StatCards({ stats, loading, error, onRetry }) {
  if (loading) return <LoadingSpinner label="Loading statistics..." />;
  if (error) return <ErrorBanner message={error} onRetry={onRetry} />;
  if (!stats) return null;

  const cards = [
    { label: "Total Leads", value: stats.total },
    ...LEAD_STATUSES.map((status) => ({ label: status, value: stats.byStatus[status] ?? 0 })),
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{card.label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
