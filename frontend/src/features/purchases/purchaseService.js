import apiClient from "../../api/apiClient";


export async function getPurchases(){

const response=
await apiClient.get(
"/purchases"
);

return response.data;

}


export async function getPurchaseById(
id
){

const response=
await apiClient.get(
`/purchases/${id}`
);

return response.data;

}


export async function createPurchase(
data
){

const response=
await apiClient.post(
"/purchases",
data
);

return response.data;

}


export async function updatePurchase(
id,
data
){

const response=
await apiClient.patch(
`/purchases/${id}`,
data
);

return response.data;

}


export async function confirmPurchase(
id,
confirmedBy
){

const response=
await apiClient.patch(
`/purchases/${id}/confirm`,
{
confirmedBy
}
);

return response.data;

}


export async function cancelPurchase(
id
){

const response=
await apiClient.patch(
`/purchases/${id}/cancel`
);

return response.data;

}