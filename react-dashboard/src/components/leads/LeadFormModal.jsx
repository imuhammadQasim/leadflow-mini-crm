import { useState } from "react";
import Modal from "../common/Modal";
import { BUDGET_RANGES, SERVICES, SOURCES } from "../../constants/leadOptions";
import { createLead } from "../../api/leadsApi";
import { useToast } from "../../hooks/useToast";

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  service: SERVICES[0],
  budgetRange: BUDGET_RANGES[0].value,
  message: "",
  source: "website",
  leadScore: "",
};

// leadScore is admin-entered on this form rather than auto-calculated - see
// api/src/controllers/leadController.js `createLead` for the reasoning
// (manual dashboard entries are scored by the admin's own judgment; the
// backend's calculateLeadScore() formula is only applied to WordPress-
// submitted leads, which is where the Logic Challenge's scoring requirement
// is satisfied).
export default function LeadFormModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const { showToast } = useToast();

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleClose() {
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setFormError(null);
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});
    try {
      const { data } = await createLead({ ...form, leadScore: Number(form.leadScore) });
      showToast(`Lead "${data.name}" created`);
      onCreated(data);
      handleClose();
    } catch (err) {
      if (err.status === 400 && Array.isArray(err.details)) {
        const errors = {};
        err.details.forEach((d) => {
          if (d.field) errors[d.field] = d.message;
        });
        setFieldErrors(errors);
        setFormError("Please fix the highlighted fields.");
      } else if (err.status === 409) {
        setFormError(err.message);
      } else {
        setFormError(err.message || "Failed to create lead");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = (field) =>
    `w-full rounded-md border px-3 py-2 text-sm focus:outline-none ${
      fieldErrors[field] ? "border-red-400 focus:border-red-500" : "border-slate-300 focus:border-slate-500"
    }`;

  return (
    <Modal open={open} onClose={handleClose} title="Add lead manually">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {formError && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            className={inputClass("name")}
          />
          {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className={inputClass("email")}
            />
            {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Phone</label>
            <input
              required
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className={inputClass("phone")}
            />
            {fieldErrors.phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Service</label>
            <select
              value={form.service}
              onChange={(e) => updateField("service", e.target.value)}
              className={inputClass("service")}
            >
              {SERVICES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Budget Range</label>
            <select
              value={form.budgetRange}
              onChange={(e) => updateField("budgetRange", e.target.value)}
              className={inputClass("budgetRange")}
            >
              {BUDGET_RANGES.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Source</label>
            <select
              value={form.source}
              onChange={(e) => updateField("source", e.target.value)}
              className={inputClass("source")}
            >
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Lead Score (0-100)</label>
            <input
              type="number"
              min="0"
              max="100"
              required
              value={form.leadScore}
              onChange={(e) => updateField("leadScore", e.target.value)}
              className={inputClass("leadScore")}
            />
            {fieldErrors.leadScore && <p className="mt-1 text-xs text-red-600">{fieldErrors.leadScore}</p>}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Message</label>
          <textarea
            required
            rows={3}
            value={form.message}
            onChange={(e) => updateField("message", e.target.value)}
            className={inputClass("message")}
          />
          {fieldErrors.message && <p className="mt-1 text-xs text-red-600">{fieldErrors.message}</p>}
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Create Lead"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
