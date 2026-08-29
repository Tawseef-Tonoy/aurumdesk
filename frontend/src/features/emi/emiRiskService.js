import apiClient from "../../api/apiClient";

export async function getEMIRiskAssessments(params = {}) {
  const response = await apiClient.get(
    "/emi-risk-assessments",
    { params }
  );

  return response.data;
}

export async function getEMIRiskAssessment(id) {
  const response = await apiClient.get(
    `/emi-risk-assessments/${id}`
  );

  return response.data;
}

export async function createEMIRiskAssessment(data) {
  const response = await apiClient.post(
    "/emi-risk-assessments",
    data
  );

  return response.data;
}

export async function recordEMIRiskDecision(id, data) {
  const response = await apiClient.patch(
    `/emi-risk-assessments/${id}/decision`,
    data
  );

  return response.data;
}
