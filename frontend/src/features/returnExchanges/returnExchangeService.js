import apiClient from "../../api/apiClient";

export async function getReturnExchanges(params={}){
  const response=await apiClient.get(
    "/return-exchanges",
    {params}
  );

  return response.data;
}

export async function getReturnExchangeById(id){
  const response=await apiClient.get(
    `/return-exchanges/${id}`
  );

  return response.data;
}

export async function getReturnEligibility(saleId){
  const response=await apiClient.get(
    `/return-exchanges/eligibility/${saleId}`
  );

  return response.data;
}

export async function createReturnExchange(data){
  const response=await apiClient.post(
    "/return-exchanges",
    data
  );

  return response.data;
}

export async function updateReturnExchange(
  id,
  data
){
  const response=await apiClient.patch(
    `/return-exchanges/${id}`,
    data
  );

  return response.data;
}

export async function submitReturnExchange(id){
  const response=await apiClient.patch(
    `/return-exchanges/${id}/submit`
  );

  return response.data;
}

export async function approveReturnExchange(
  id,
  approvedBy
){
  const response=await apiClient.patch(
    `/return-exchanges/${id}/approve`,
    {approvedBy}
  );

  return response.data;
}

export async function rejectReturnExchange(
  id,
  data
){
  const response=await apiClient.patch(
    `/return-exchanges/${id}/reject`,
    data
  );

  return response.data;
}

export async function cancelReturnExchange(
  id,
  cancelledBy
){
  const response=await apiClient.patch(
    `/return-exchanges/${id}/cancel`,
    {cancelledBy}
  );

  return response.data;
}

export async function completeReturnExchange(
  id,
  data
){
  const response=await apiClient.patch(
    `/return-exchanges/${id}/complete`,
    data
  );

  return response.data;
}