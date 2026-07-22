import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createExpense } from "./expenseService";

function ExpenseFormPage(){
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

    const handleChange=(e)=>{
        setFormData({...formData,[e.target.name]:e.target.value});
    };

    const handleSubmit=async(e)=>{
        e.preventDefault();
        try{
            await createExpense(formData);
            navigate("/expenses");
        }
        catch(error){
            console.log(error);
        }
    };

    return (
        <div>
            <h1 className="mb-4">
                Add Expense
            </h1>

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label>
                        Expense Date
                    </label>

                    <input
                    type="date"
                    className="form-control"
                    name="expenseDate"
                    value={formData.expenseDate}
                    onChange={handleChange}
                    />
                </div>

                <div className="mb-3">
                    <label>
                        Category
                    </label>

                    <select
                    className="form-control"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    >
                        <option value="">
                            Select Category
                        </option>

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
                </div>

                <div className="mb-3">
                    <label>
                        Amount
                    </label>

                    <input
                    type="number"
                    className="form-control"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    />
                </div>

                <div className="mb-3">
                    <label>
                        Payment Method
                    </label>
                    <select
                    className="form-control"
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
                </div>

                <div className="mb-3">
                    <label>
                        Paid To
                    </label>
                    <input
                    className="form-control"
                    name="paidTo"
                    value={formData.paidTo}
                    onChange={handleChange}
                    />
                </div>

                <div className="mb-3">
                    <label>
                        Voucher Number
                    </label>

                    <input
                    className="form-control"
                    name="voucherNumber"
                    value={formData.voucherNumber}
                    onChange={handleChange}
                    />
                </div>

                <div className="mb-3">
                    <label>
                        Description
                    </label>
                    <textarea
                    className="form-control"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    />
                </div>

                <button className="btn btn-dark">
                    Save Expense
                </button>
            </form>
        </div>
    );
}


export default ExpenseFormPage;