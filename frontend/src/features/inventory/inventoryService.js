import apiClient from "../../api/apiClient";

export async function getInventoryItems(params = {}) {
  const response = await apiClient.get(
    "/jewelry-items",
    { params }
  );

  return response.data;
}

export async function getInventoryItemById(id) {
  const response = await apiClient.get(
    `/jewelry-items/${id}`
  );

  return response.data;
}

export async function createInventoryItem(itemData) {
  const response = await apiClient.post(
    "/jewelry-items",
    itemData
  );

  return response.data;
}

export async function updateInventoryItem(
  id,
  itemData
) {
  const response = await apiClient.patch(
    `/jewelry-items/${id}`,
    itemData
  );

  return response.data;
}

export async function deactivateInventoryItem(id) {
  const response = await apiClient.patch(
    `/jewelry-items/${id}/deactivate`
  );

  return response.data;
}
