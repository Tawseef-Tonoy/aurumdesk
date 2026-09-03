import apiClient from "../../api/apiClient";


export async function getMonthlyReport(year,month){

const response=
await apiClient.get(
"/monthly-reports",
{
params:{
year,
month
}
}
);


return response.data;

}