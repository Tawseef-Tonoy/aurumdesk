import apiClient from "../../api/apiClient";


export async function createClosing(data){

const response=
await apiClient.post(
"/cash-closings",
data
);

return response.data;

}



export async function getAllClosings(){

const response=
await apiClient.get(
"/cash-closings"
);

return response.data;

}



export async function getClosing(date){

const response=
await apiClient.get(
`/cash-closings/${date}`
);

return response.data;

}



export async function updateClosing(id,data){

const response=
await apiClient.patch(
`/cash-closings/${id}`,
data
);

return response.data;

}



export async function refreshClosing(id){

const response=
await apiClient.patch(
`/cash-closings/${id}/refresh`
);

return response.data;

}



export async function reopenClosing(id,data){

const response=
await apiClient.patch(
`/cash-closings/${id}/reopen`,
data
);

return response.data;

}