import apiClient from "../../api/apiClient";

// Get all gold rates
export const getGoldRates = async () => {
    const response = await apiClient.get("/gold-rates");
    return response.data;
};


// Create gold rate
export const createGoldRate = async (data) => {
    const response = await apiClient.post("/gold-rates",data);
    return response.data;
};

// Update gold rate
export const updateGoldRate = async (id, data) => {
    const response = await apiClient.patch(`/gold-rates/${id}`,data);
    return response.data;
};

// Activate gold rate
export const activateGoldRate = async (id) => {
    const response = await apiClient.patch(`/gold-rates/${id}/activate`);
    return response.data;
};

// Deactivate gold rate
export const deactivateGoldRate = async (id) => {
    const response = await apiClient.patch(`/gold-rates/${id}/deactivate`);
    return response.data;
};