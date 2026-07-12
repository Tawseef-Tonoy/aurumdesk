import apiClient from "../../api/apiClient";

export async function getCustomers(params = {}) {
  const response = await apiClient.get(
    "/customers",
    { params }
  );

  return response.data;
}

export async function getCustomerById(id) {
  const response = await apiClient.get(
    `/customers/${id}`
  );

  return response.data;
}

export async function createCustomer(customerData) {
  const response = await apiClient.post(
    "/customers",
    customerData
  );

  return response.data;
}

export async function updateCustomer(
  id,
  customerData
) {
  const response = await apiClient.patch(
    `/customers/${id}`,
    customerData
  );

  return response.data;
}

export async function deactivateCustomer(id) {
  const response = await apiClient.patch(
    `/customers/${id}/deactivate`
  );

  return response.data;
}