import apiClient from "../../api/apiClient";

export async function getAssignments(){
const response=await apiClient.get("/worker-assignments");
return response.data;
}

export async function getAssignmentByOrder(id){
const response=await apiClient.get(`/worker-assignments/order/${id}`);
return response.data;
}

export async function createAssignment(data){
const response=await apiClient.post("/worker-assignments",data);
return response.data;
}

export async function updateAssignment(id,data){
const response=await apiClient.patch(`/worker-assignments/${id}`,data);
return response.data;
}