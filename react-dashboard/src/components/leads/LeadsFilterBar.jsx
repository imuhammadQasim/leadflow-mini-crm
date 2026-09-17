import { LEAD_STATUSES } from "../../constants/leadOptions";

export default function LeadsFilterBar({
  searchInput,
  onSearchInputChange,
  status,
  onStatusChange,
  view,
  onViewChange,
  onAddLead,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row">
        <input
          type="search"
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          placeholder="Search name, email, or message..."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none sm:max-w-xs"
        />
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        >
          <option value="">All statuses</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex rounded-md border border-slate-300 p-0.5 text-sm">
          <button
            type="button"
            onClick={() => onViewChange("table")}
            className={`rounded px-3 py-1 ${view === "table" ? "bg-slate-900 text-white" : "text-slate-600"}`}
          >
            Table
          </button>
          {/* <button
            type="button"
            onClick={() => onViewChange("kanban")}
            className={`rounded px-3 py-1 ${view === "kanban" ? "bg-slate-900 text-white" : "text-slate-600"}`}
          >
            Kanban
          </button> */}
        </div>
        <button
          type="button"
          onClick={onAddLead}
          className="whitespace-nowrap rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Add Lead
        </button>
      </div>
    </div>
  );
}
