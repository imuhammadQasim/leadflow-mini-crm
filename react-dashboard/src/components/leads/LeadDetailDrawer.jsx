import { useState } from "react";
import Modal from "../common/Modal";
import ConfirmDialog from "../common/ConfirmDialog";
import StatusBadge from "./StatusBadge";
import LeadScoreBadge from "./LeadScoreBadge";
import { LEAD_STATUSES } from "../../constants/leadOptions";
import { formatBudgetRange, formatDate } from "../../utils/formatters";
import { updateLead, deleteLead } from "../../api/leadsApi";
import { useToast } from "../../hooks/useToast";

// Rendered with key={lead?._id} by the caller (DashboardPage), so React
// remounts this component fresh whenever a different lead is selected -
// scoreInput below is initialized straight from that lead's score with no
// effect needed to keep it in sync (React's recommended fix for "reset
// state when a prop changes": https://react.dev/learn/you-might-not-need-an-effect).
export default function LeadDetailDrawer({ lead, onClose, onUpdated, onDeleted }) {
  const [statusSaving, setStatusSaving] = useState(false);
  const [scoreInput, setScoreInput] = useState(lead ? String(lead.leadScore) : "");
  const [scoreSaving, setScoreSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  if (!lead) return null;

  async function handleStatusChange(newStatus) {
    setStatusSaving(true);
    try {
      const { data } = await updateLead(lead._id, { status: newStatus });
      onUpdated(data);
      showToast(`Status updated to ${newStatus}`);
    } catch (err) {
      showToast(err.message || "Failed to update status", "error");
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleScoreSave() {
    const value = Number(scoreInput);
    if (Number.isNaN(value) || value < 0 || value > 100) {
      showToast("Score must be a number between 0 and 100", "error");
      return;
    }
    setScoreSaving(true);
    try {
      const { data } = await updateLead(lead._id, { leadScore: value });
      onUpdated(data);
      showToast("Lead score updated");
    } catch (err) {
      showToast(err.message || "Failed to update score", "error");
    } finally {
      setScoreSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteLead(lead._id);
      showToast("Lead deleted");
      onDeleted(lead._id);
    } catch (err) {
      showToast(err.message || "Failed to delete lead", "error");
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  return (
    <>
      <Modal open={Boolean(lead)} onClose={onClose} title={lead.name} widthClass="max-w-xl">
        <div className="flex flex-col gap-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={lead.status} />
            <LeadScoreBadge score={lead.leadScore} />
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">
              via {lead.createdVia === "wordpress" ? "WordPress" : "Manual entry"}
            </span>
          </div>

          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-slate-500">Email</dt>
              <dd>
                <a href={`mailto:${lead.email}`} className="text-slate-900 hover:underline">
                  {lead.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Phone</dt>
              <dd>
                <a href={`tel:${lead.phone}`} className="text-slate-900 hover:underline">
                  {lead.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Service</dt>
              <dd className="text-slate-900">{lead.service}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Budget Range</dt>
              <dd className="text-slate-900">{formatBudgetRange(lead.budgetRange)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Source</dt>
              <dd className="capitalize text-slate-900">{lead.source}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Received</dt>
              <dd className="text-slate-900">{formatDate(lead.createdAt)}</dd>
            </div>
          </dl>

          <div>
            <dt className="mb-1 text-xs font-medium text-slate-500">Message</dt>
            <dd className="whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-slate-700">{lead.message}</dd>
          </div>

          <div className="grid grid-cols-1 gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Change status</label>
              <select
                value={lead.status}
                disabled={statusSaving}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none disabled:opacity-60"
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Lead score (0-100)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={scoreInput}
                  onChange={(e) => setScoreInput(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleScoreSave}
                  disabled={scoreSaving}
                  className="whitespace-nowrap rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {scoreSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Delete lead
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this lead?"
        message={`This permanently removes "${lead.name}" from the CRM. This can't be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </>
  );
}
