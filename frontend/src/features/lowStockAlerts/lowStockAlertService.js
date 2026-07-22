import apiClient from "../../api/apiClient";

export async function getLowStockAlerts(
  params = {}
) {
  const response = await apiClient.get(
    "/low-stock-alerts",
    {
      params,
    }
  );

  return response.data;
}

export async function getLowStockAlertById(
  id
) {
  const response = await apiClient.get(
    `/low-stock-alerts/${id}`
  );

  return response.data;
}

export async function markLowStockAlertViewed(
  id
) {
  const response = await apiClient.patch(
    `/low-stock-alerts/${id}/view`
  );

  return response.data;
}

export async function markLowStockReorderPlanned(
  id,
  notes = ""
) {
  const response = await apiClient.patch(
    `/low-stock-alerts/${id}/reorder-planned`,
    {
      notes,
    }
  );

  return response.data;
}

export async function resolveLowStockAlert(
  id,
  notes = ""
) {
  const response = await apiClient.patch(
    `/low-stock-alerts/${id}/resolve`,
    {
      notes,
    }
  );

  return response.data;
}

export async function syncAllLowStockAlerts() {
  const response = await apiClient.post(
    "/low-stock-alerts/sync"
  );

  return response.data;
}
