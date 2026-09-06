import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {updateExpense} from "./expenseService";
import apiClient from "../../api/apiClient";

function ExpenseEditPage(){
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData,setFormData] = useState({
        expenseDate:"",
        category:"",
        amount:"",
        paymentMethod:"CASH",
        paidTo:"",
        voucherNumber:"",
        description:""
    });

    useEffect(()=>{
        async function loadExpense(){
            try{
                const response = await apiClient.get(`/expenses/${id}`);
                const expense = response.data.data;

                setFormData({
                    expenseDate:expense.expenseDate.substring(0,10),
                    category:expense.category,
                    amount:expense.amount,
                    paymentMethod:expense.paymentMethod,
                    paidTo:expense.paidTo,
                    voucherNumber:expense.voucherNumber || "",
                    description:expense.description || ""
                });
            }
            catch(error){
                console.log(error);
            }
        }
        loadExpense();
    },[id]);

    const handleChange=(e)=>{
        setFormData({...formData,[e.target.name]:e.target.value});
    };

    const handleSubmit=async(e)=>{
        e.preventDefault();
        try{
            await updateExpense(id,formData);
            navigate("/expenses");
        }
        catch(error){
            console.log(error);
        }
    };

    return (
        <div>
            <h1 className="mb-4">
                Edit Expense
            </h1>

            <form onSubmit={handleSubmit}>
                <input
                className="form-control mb-3"
                type="date"
                name="expenseDate"
                value={formData.expenseDate}
                onChange={handleChange}
                />

                <select
                className="form-control mb-3"
                name="category"
                value={formData.category}
                onChange={handleChange}
                >
                    <option value="RENT">
                        RENT
                    </option>

                    <option value="ELECTRICITY">
                        ELECTRICITY
                    </option>

                    <option value="SALARY">
                        SALARY
                    </option>

                    <option value="WORKER_PAYMENT">
                        WORKER PAYMENT
                    </option>

                    <option value="TRANSPORTATION">
                        TRANSPORTATION
                    </option>

                    <option value="PACKAGING">
                        PACKAGING
                    </option>

                    <option value="MAINTENANCE">
                        MAINTENANCE
                    </option>

                    <option value="MARKETING">
                        MARKETING
                    </option>

                    <option value="SECURITY">
                        SECURITY
                    </option>

                    <option value="MISCELLANEOUS">
                        MISCELLANEOUS
                    </option>
                </select>

                <input
                className="form-control mb-3"
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                />

                <select
                className="form-control mb-3"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                >

                    <option value="CASH">
                        CASH
                    </option>

                    <option value="BANK_TRANSFER">
                        BANK TRANSFER
                    </option>

                    <option value="CARD">
                        CARD
                    </option>

                    <option value="MOBILE_BANKING">
                        MOBILE BANKING
                    </option>
                </select>

                <input
                className="form-control mb-3"
                name="paidTo"
                value={formData.paidTo}
                onChange={handleChange}
                />

                <input
                className="form-control mb-3"
                name="voucherNumber"
                value={formData.voucherNumber}
                onChange={handleChange}
                />


                <textarea
                className="form-control mb-3"
                name="description"
                value={formData.description}
                onChange={handleChange}
                />

                <button className="btn btn-dark">
                    Update Expense
                </button>
            </form>
        </div>
    );
}


export default ExpenseEditPage;