import { LEAD_STATUSES } from "../../constants/leadOptions";
import LoadingSpinner from "../common/LoadingSpinner";
import ErrorBanner from "../common/ErrorBanner";
import EmptyState from "../common/EmptyState";
import LeadScoreBadge from "./LeadScoreBadge";

/**
 * Creativity feature: a Kanban view of the leads currently loaded in the
 * table (same filtered/paginated set - it's a different way to look at the
 * same data, not a separate fetch). Leads are grouped into one column per
 * status client-side with Array.filter, so no new API endpoint was needed.
 *
 * Moving a card between columns uses a <select> on each card (not native
 * HTML5 drag-and-drop) so it stays fully usable on touch/mobile - drag-and-
 * drop has no built-in touch support and the dashboard has to stay usable
 * on tablet per the requirements. The select calls the same PATCH
 * /leads/:id status-change path already used elsewhere (onStatusChange),
 * so there's no separate "move card" logic to maintain.
 */
export default function KanbanBoard({ leads, loading, error, onRetry, onSelectLead, onStatusChange }) {
  if (loading) return <LoadingSpinner label="Loading leads..." />;
  if (error) return <ErrorBanner message={error} onRetry={onRetry} />;
  if (leads.length === 0) {
    return <EmptyState title="No leads to show" description="Adjust your filters or add a lead." />;
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {LEAD_STATUSES.map((status) => {
        const columnLeads = leads.filter((lead) => lead.status === status);
        return (
          <div key={status} className="w-64 shrink-0 rounded-xl bg-slate-100 p-2">
            <div className="flex items-center justify-between px-1 pb-2">
              <h3 className="text-sm font-semibold text-slate-700">{status}</h3>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
                {columnLeads.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {columnLeads.map((lead) => (
                <div key={lead._id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                  <button
                    type="button"
                    onClick={() => onSelectLead(lead)}
                    className="block w-full text-left text-sm font-medium text-slate-900 hover:underline"
                  >
                    {lead.name}
                  </button>
                  <p className="truncate text-xs text-slate-500">{lead.email}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <LeadScoreBadge score={lead.leadScore} />
                    <select
                      value={lead.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onStatusChange(lead._id, e.target.value)}
                      className="rounded border border-slate-200 bg-slate-50 px-1.5 py-1 text-xs focus:outline-none"
                      aria-label={`Move ${lead.name} to a different status`}
                    >
                      {LEAD_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
              {columnLeads.length === 0 && (
                <p className="px-1 py-3 text-center text-xs text-slate-400">No leads</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
