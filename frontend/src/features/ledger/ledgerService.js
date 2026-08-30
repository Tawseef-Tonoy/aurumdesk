import apiClient from "../../api/apiClient";

export async function getLedgerSummary(){
  const response=await apiClient.get(
    "/customer-ledgers"
  );

  return response.data;
}

export async function getLedgerBalance(
  customerId
){
  const response=await apiClient.get(
    `/customer-ledgers/${customerId}/balance`
  );

  return response.data;
}

export async function getLedgerStatement(
  customerId,
  params={}
){
  const response=await apiClient.get(
    `/customer-ledgers/${customerId}/statement`,
    {params}
  );

  return response.data;
}

export async function getInvoiceOutstanding(
  customerId
){
  const response=await apiClient.get(
    `/customer-ledgers/${customerId}/outstanding`
  );

  return response.data;
}

export async function getDateWiseOutstanding(
  customerId
){
  const response=await apiClient.get(
    `/customer-ledgers/${customerId}/date-wise`
  );

  return response.data;
}

export async function getDueAging(
  customerId,
  asOf
){
  const response=await apiClient.get(
    `/customer-ledgers/${customerId}/aging`,
    {
      params:{asOf}
    }
  );

  return response.data;
}

export async function createLedgerAdjustment(
  data
){
  const response=await apiClient.post(
    "/customer-ledgers/adjustments",
    data
  );

  return response.data;
}

export async function getCustomers(){
  const response=await apiClient.get(
    "/customers"
  );

  return response.data;
}

export async function getAdjustableSales(
  customerId
){
  const response=await apiClient.get(
    `/sales/customer/${customerId}/adjustable`
  );

  return response.data;
}