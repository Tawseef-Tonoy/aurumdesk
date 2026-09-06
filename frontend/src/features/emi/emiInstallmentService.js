import apiClient from "../../api/apiClient";

export async function getEMIInstallments(
  params = {}
) {
  const response =
    await apiClient.get(
      "/emi-installments",
      {
        params,
      }
    );

  return response.data;
}

export async function getEMIInstallment(
  id
) {
  const response =
    await apiClient.get(
      `/emi-installments/${id}`
    );

  return response.data;
}

export async function refreshEMIStatuses() {
  const response =
    await apiClient.post(
      "/emi-installments/refresh-statuses"
    );

  return response.data;
}

export async function recordEMIPayment(
  installmentId,
  data
) {
  const response =
    await apiClient.post(
      `/emi-installments/${installmentId}/payments`,
      data
    );

  return response.data;
}

export async function waiveEMIInstallment(
  installmentId,
  data
) {
  const response =
    await apiClient.patch(
      `/emi-installments/${installmentId}/waive`,
      data
    );

  return response.data;
}

export async function rescheduleEMIInstallment(
  installmentId,
  data
) {
  const response =
    await apiClient.patch(
      `/emi-installments/${installmentId}/reschedule`,
      data
    );

  return response.data;
}
