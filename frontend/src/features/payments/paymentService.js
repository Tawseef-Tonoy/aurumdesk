import apiClient from "../../api/apiClient";

// GET ALL PAYMENTS
export const getPayments = async()=>{
    const response = await apiClient.get("/payments");
    return response.data;
};

// CREATE PAYMENT
export const createPayment = async(data)=>{
    const response = await apiClient.post( "/payments", data);
    return response.data;
};

// UPDATE PAYMENT
export const updatePayment = async(id,data)=>{
    const response = await apiClient.patch(`/payments/${id}`,data);
    return response.data;
};

// CANCEL PAYMENT
export const cancelPayment = async(id)=>{
    const response = await apiClient.patch(`/payments/${id}/cancel`);
    return response.data;
};

// GET CUSTOMERS FOR DROPDOWN
export const getCustomers = async()=>{
    const response =await apiClient.get("/customers");
    return response.data;
};