import type { DashboardData } from "./analytics";

const hasCrmConfig = (): boolean => {
  return !!(process.env.CRM_API_URL && process.env.CRM_API_KEY);
};

/**
 * Fetch CRM pipeline data (MQL, SQL, closed deals, CPL) for the given date range.
 * Replace with real CRM API calls when credentials are set.
 */
export async function fetchCrmMetrics(
  _dateFrom: string,
  _dateTo: string
): Promise<Partial<DashboardData> | null> {
  if (!hasCrmConfig()) return null;
  // TODO: GET /leads, /deals, etc. and map to b2b shape.
  return null;
}

export { hasCrmConfig };
