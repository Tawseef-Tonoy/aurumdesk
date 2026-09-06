import apiClient from "../../api/apiClient";


export async function getSuppliers(){

const response=
await apiClient.get(
"/suppliers"
);

return response.data;

}


export async function createSupplier(
data
){

const response=
await apiClient.post(
"/suppliers",
data
);

return response.data;

}


export async function updateSupplier(
id,
data
){

const response=
await apiClient.patch(
`/suppliers/${id}`,
data
);

return response.data;

}