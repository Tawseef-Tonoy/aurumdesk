import apiClient from "../../api/apiClient";

export async function getWorkers(){
const response=await apiClient.get("/workers");
return response.data;
}

export async function getWorkerById(id){
const response=await apiClient.get(`/workers/${id}`);
return response.data;
}

export async function createWorker(data){
const response=await apiClient.post("/workers",data);
return response.data;
}

export async function updateWorker(id,data){
const response=await apiClient.patch(`/workers/${id}`,data);
return response.data;
}