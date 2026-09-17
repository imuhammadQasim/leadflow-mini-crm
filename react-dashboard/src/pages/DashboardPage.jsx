import { useState } from "react";
import { useLeads } from "../hooks/useLeads";
import { useStats } from "../hooks/useStats";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { updateLead } from "../api/leadsApi";
import { useToast } from "../hooks/useToast";
import StatCards from "../components/leads/StatCards";
import LeadsFilterBar from "../components/leads/LeadsFilterBar";
import LeadsTable from "../components/leads/LeadsTable";
import KanbanBoard from "../components/leads/KanbanBoard";
import LeadFormModal from "../components/leads/LeadFormModal";
import LeadDetailDrawer from "../components/leads/LeadDetailDrawer";

const LIMIT = 20;

export default function DashboardPage() {
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [view, setView] = useState("table");
  const [selectedLead, setSelectedLead] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const { showToast } = useToast();

  const debouncedSearch = useDebouncedValue(searchInput, 400);

  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useStats();
  const {
    leads,
    pagination,
    loading: leadsLoading,
    error: leadsError,
    refetch: refetchLeads,
  } = useLeads({ status, q: debouncedSearch, page, limit: LIMIT });

  function handleSearchChange(value) {
    setSearchInput(value);
    setPage(1);
  }

  function handleStatusFilterChange(value) {
    setStatus(value);
    setPage(1);
  }

  function handleLeadCreated() {
    refetchLeads();
    refetchStats();
  }

  function handleLeadUpdated() {
    // Simplest correct option: re-fetch rather than patch the array in
    // memory by hand, since a status/score change also shifts the stats
    // cards and (for status) which Kanban column the lead belongs in.
    refetchLeads();
    refetchStats();
    setSelectedLead(null);
  }

  function handleLeadDeleted() {
    refetchLeads();
    refetchStats();
    setSelectedLead(null);
  }

  // Used by the Kanban board's per-card status <select> - same endpoint the
  // detail drawer uses, just triggered from a different place in the UI.
  async function handleKanbanStatusChange(leadId, newStatus) {
    try {
      await updateLead(leadId, { status: newStatus });
      showToast(`Status updated to ${newStatus}`);
      refetchLeads();
      refetchStats();
    } catch (err) {
      showToast(err.message || "Failed to update status", "error");
    }
  }

  const hasFilters = Boolean(status || debouncedSearch);

  return (
    <div className="flex flex-col gap-6">
      <StatCards stats={stats} loading={statsLoading} error={statsError} onRetry={refetchStats} />

      <LeadsFilterBar
        searchInput={searchInput}
        onSearchInputChange={handleSearchChange}
        status={status}
        onStatusChange={handleStatusFilterChange}
        view={view}
        onViewChange={setView}
        onAddLead={() => setCreateOpen(true)}
      />

      {view === "table" ? (
        <LeadsTable
          leads={leads}
          loading={leadsLoading}
          error={leadsError}
          onRetry={refetchLeads}
          onSelectLead={setSelectedLead}
          hasFilters={hasFilters}
        />
      ) : (
        <KanbanBoard
          leads={leads}
          loading={leadsLoading}
          error={leadsError}
          onRetry={refetchLeads}
          onSelectLead={setSelectedLead}
          onStatusChange={handleKanbanStatusChange}
        />
      )}

      {!leadsLoading && !leadsError && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm text-slate-600">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.pages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      <LeadFormModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={handleLeadCreated} />

      <LeadDetailDrawer
        key={selectedLead?._id || "none"}
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdated={handleLeadUpdated}
        onDeleted={handleLeadDeleted}
      />
    </div>
  );
}
