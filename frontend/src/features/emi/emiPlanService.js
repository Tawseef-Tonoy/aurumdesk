import apiClient from "../../api/apiClient";

export async function getEMIPlans(
  params = {}
) {
  const response =
    await apiClient.get(
      "/emi-plans",
      { params }
    );

  return response.data;
}

export async function getEMIPlanById(id) {
  const response =
    await apiClient.get(
      `/emi-plans/${id}`
    );

  return response.data;
}

export async function createEMIPlan(data) {
  const response =
    await apiClient.post(
      "/emi-plans",
      data
    );

  return response.data;
}

export async function updateEMIPlan(
  id,
  data
) {
  const response =
    await apiClient.patch(
      `/emi-plans/${id}`,
      data
    );

  return response.data;
}

export async function submitEMIPlan(id) {
  const response =
    await apiClient.patch(
      `/emi-plans/${id}/submit`
    );

  return response.data;
}

export async function approveEMIPlan(
  id,
  approvedBy
) {
  const response =
    await apiClient.patch(
      `/emi-plans/${id}/approve`,
      {
        approvedBy,
      }
    );

  return response.data;
}

export async function rejectEMIPlan(
  id,
  reason,
  rejectedBy
) {
  const response =
    await apiClient.patch(
      `/emi-plans/${id}/reject`,
      {
        reason,
        rejectedBy,
      }
    );

  return response.data;
}

export async function requestEMIRevision(
  id,
  reason
) {
  const response =
    await apiClient.patch(
      `/emi-plans/${id}/revision`,
      {
        reason,
      }
    );

  return response.data;
}

export async function cancelEMIPlan(id) {
  const response =
    await apiClient.patch(
      `/emi-plans/${id}/cancel`
    );

  return response.data;
}

export async function getCustomers() {
  const response =
    await apiClient.get(
      "/customers"
    );

  return response.data;
}

export async function getSales() {
  const response =
    await apiClient.get(
      "/sales"
    );

  return response.data;
}
