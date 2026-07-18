import apiClient from "../../api/apiClient";


// GET ALL EXPENSES
export const getExpenses = async()=>{
    const response =await apiClient.get("/expenses");
    return response.data;
};

// CREATE EXPENSE
export const createExpense = async(data)=>{
    const response =await apiClient.post("/expenses",data);
    return response.data;
};

// UPDATE EXPENSE
export const updateExpense = async(id,data)=>{
    const response =await apiClient.patch(`/expenses/${id}`,data);
    return response.data;
};

// CONFIRM EXPENSE
export const confirmExpense = async(id)=>{
    const response =await apiClient.patch(`/expenses/${id}/confirm`);
    return response.data;
};

// CANCEL EXPENSE
export const cancelExpense = async(id)=>{
    const response =await apiClient.patch(`/expenses/${id}/cancel`);
    return response.data;
};

// SUMMARY
export const getExpenseSummary = async()=>{
    const response =await apiClient.get("/expenses/summary");
    return response.data;
};