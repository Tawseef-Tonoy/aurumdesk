import apiClient from "../../api/apiClient";

export async function getStockAdjustments(
  params = {}
) {
  const response = await apiClient.get(
    "/stock-adjustments",
    {
      params,
    }
  );

  return response.data;
}

export async function getStockAdjustmentById(
  id
) {
  const response = await apiClient.get(
    `/stock-adjustments/${id}`
  );

  return response.data;
}

export async function getItemStockAdjustments(
  itemId
) {
  const response = await apiClient.get(
    `/stock-adjustments/item/${itemId}`
  );

  return response.data;
}

export async function createStockAdjustment(
  adjustmentData
) {
  const response = await apiClient.post(
    "/stock-adjustments",
    adjustmentData
  );

  return response.data;
}

export async function getInventoryItems(
  params = {}
) {
  const response = await apiClient.get(
    "/jewelry-items",
    {
      params,
    }
  );

  return response.data;
}
