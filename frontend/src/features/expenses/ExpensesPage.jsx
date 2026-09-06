import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {getExpenses,confirmExpense,cancelExpense,getExpenseSummary} from "./expenseService";

function ExpensesPage(){
    const [expenses,setExpenses]=useState([]);
    const [totalExpense,setTotalExpense]=useState(0);
    const navigate=useNavigate();

    async function loadExpenses(){
        const response = await getExpenses();
        setExpenses(response.data);

        const summary = await getExpenseSummary();
        setTotalExpense(summary.totalExpense);
}

    useEffect(()=>{
        loadExpenses();
    },[]);

    async function handleConfirm(id){
        await confirmExpense(id);
        loadExpenses();
    }

    async function handleCancel(id){
        await cancelExpense(id);
        loadExpenses();
    }

    return (
        <div>
            <div className="d-flex justify-content-between mb-4">
                <div>
                    <h1>
                        Expenses
                    </h1>

                    <p>
                        Manage business expenses.
                    </p>
                </div>

                <div className="card page-card mb-4">
                    <div className="card-body">
                        <h5>
                            Total Confirmed Expense
                        </h5>

                        <h2>
                            ৳ {totalExpense}
                        </h2>

                        <p className="text-muted">
                            Only confirmed expenses are counted.
                        </p>
                    </div>
                </div>

                <button
                className="btn btn-dark"
                onClick={()=>navigate("/expenses/new")}
                >
                    Add Expense
                </button>
            </div>
            {
                expenses.length===0 ?
                <div className="card p-4 text-center">
                    No expenses found.
                </div>
                :
                expenses.map(expense=>(
                    <div
                    className="card p-3 mb-3"
                    key={expense._id}
                    >

                        <h5>
                            {expense.category}
                        </h5>

                        <p>
                            Amount: {expense.amount}
                        </p>

                        <p>
                            Paid To: {expense.paidTo}
                        </p>

                        <p>
                            Payment:{expense.paymentMethod}
                        </p>

                        <p>
                            Status: {expense.status}
                        </p>

                        <button
                        className="btn btn-secondary mb-2"
                        onClick={()=> navigate(`/expenses/${expense._id}/edit`)}
                        >
                            Edit
                        </button>

                        {
                            expense.status==="PENDING" &&
                            <>
                            <button
                            className="btn btn-success me-2"
                            onClick={()=> handleConfirm(expense._id)}
                            >
                                Confirm
                            </button>

                            <button
                            className="btn btn-danger"
                            onClick={()=>handleCancel(expense._id)}
                            >
                                Cancel
                            </button>
                            </>
                        }
                    </div>
                ))
            }
        </div>
    );
}

export default ExpensesPage;