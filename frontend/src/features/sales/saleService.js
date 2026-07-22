import apiClient from "../../api/apiClient";

export const getSales = async () => {
  const response = await apiClient.get("/sales");
  return response.data;
};

export const getSaleById = async (id) => {
  const response = await apiClient.get(`/sales/${id}`);
  return response.data;
};

export const createSale = async (data) => {
  const response = await apiClient.post("/sales", data);
  return response.data;
};

export const updateSale = async (id, data) => {
  const response = await apiClient.patch(`/sales/${id}`, data);
  return response.data;
};

export const confirmSale = async (id) => {
  const response = await apiClient.patch(`/sales/${id}/confirm`);
  return response.data;
};

export const cancelSale = async (id) => {
  const response = await apiClient.patch(`/sales/${id}/cancel`);
  return response.data;
};