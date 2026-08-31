import apiClient from "../../api/apiClient";

export async function getPayments(){
  const response=await apiClient.get(
    "/payments"
  );

  return response.data;
}

export async function getPaymentById(id){
  const response=await apiClient.get(
    `/payments/${id}`
  );

  return response.data;
}

export async function createPayment(data){
  const response=await apiClient.post(
    "/payments",
    data
  );

  return response.data;
}

export async function updatePayment(id,data){
  const response=await apiClient.patch(
    `/payments/${id}`,
    data
  );

  return response.data;
}

export async function confirmPayment(id){
  const response=await apiClient.patch(
    `/payments/${id}/confirm`
  );

  return response.data;
}

export async function cancelPayment(id,data){
  const response=await apiClient.patch(
    `/payments/${id}/cancel`,
    data
  );

  return response.data;
}

export async function getCustomers(){
  const response=await apiClient.get(
    "/customers"
  );

  return response.data;
}

export async function getOutstandingSales(
  customerId
){
  const response=await apiClient.get(
    `/sales/customer/${customerId}/outstanding`
  );

  return response.data;
}