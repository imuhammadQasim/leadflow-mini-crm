import { useCallback, useEffect, useState } from "react";
import { listLeads } from "../api/leadsApi";

const DEFAULT_PAGINATION = { page: 1, limit: 20, total: 0, pages: 0 };

// Owns fetching + loading/error state for the leads list. Kept local to
// whichever page uses it (DashboardPage) rather than a global context -
// nothing else in the app needs this data, so a global store would just be
// indirection for no benefit.
export function useLeads({ status, q, page, limit }) {
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listLeads({ status, q, page, limit });
      setLeads(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setError(err.message || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [status, q, page, limit]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return { leads, pagination, loading, error, refetch: fetchLeads };
}
