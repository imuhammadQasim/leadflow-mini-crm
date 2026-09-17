import LoadingSpinner from "../common/LoadingSpinner";
import ErrorBanner from "../common/ErrorBanner";
import EmptyState from "../common/EmptyState";
import StatusBadge from "./StatusBadge";
import LeadScoreBadge from "./LeadScoreBadge";
import { formatDate } from "../../utils/formatters";

export default function LeadsTable({ leads, loading, error, onRetry, onSelectLead, hasFilters }) {
  if (loading) return <LoadingSpinner label="Loading leads..." />;
  if (error) return <ErrorBanner message={error} onRetry={onRetry} />;
  if (leads.length === 0) {
    return (
      <EmptyState
        title={hasFilters ? "No leads match your filters" : "No leads yet"}
        description={
          hasFilters
            ? "Try a different search term or clear the status filter."
            : "New leads from WordPress or leads you add manually will show up here."
        }
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {["Name", "Contact", "Service", "Score", "Status", "Received"].map((h) => (
              <th key={h} className="whitespace-nowrap px-4 py-2.5 text-left font-medium text-slate-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {leads.map((lead) => (
            <tr
              key={lead._id}
              onClick={() => onSelectLead(lead)}
              className="cursor-pointer hover:bg-slate-50"
            >
              <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{lead.name}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                <div>{lead.email}</div>
                <div className="text-xs text-slate-400">{lead.phone}</div>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{lead.service}</td>
              <td className="whitespace-nowrap px-4 py-3">
                <LeadScoreBadge score={lead.leadScore} />
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <StatusBadge status={lead.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(lead.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
