import apiClient from "../../api/apiClient";

export async function getCustomOrders(params={}){
const response=await apiClient.get("/custom-orders",{params});
return response.data;
}

export async function getCustomOrderById(id){
const response=await apiClient.get(`/custom-orders/${id}`);
return response.data;
}

export async function createCustomOrder(data){
const response=await apiClient.post("/custom-orders",data);
return response.data;
}

export async function updateCustomOrder(id,data){
const response=await apiClient.patch(`/custom-orders/${id}`,data);
return response.data;
}

export async function getCustomOrderReceipt(id){
const response=await apiClient.get(`/custom-orders/${id}/receipt`);
return response.data;
}