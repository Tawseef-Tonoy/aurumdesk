import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {getPayments,cancelPayment} from "./paymentService";

function PaymentsPage(){
    const [payments,setPayments] = useState([]);
    const navigate = useNavigate();
    async function loadPayments(){
        try{
            const response = await getPayments();
            setPayments(response.data);
        }
        catch(error){
            console.log(error);
        }
    }

    useEffect(()=>{
        loadPayments();
    },[]);

    async function handleCancel(id){
        try{
            await cancelPayment(id);
            loadPayments();
        }
        catch(error){
            console.log(error);
        }
    }

    return (

        <div>
            <div className="d-flex justify-content-between mb-4">
                <div>
                    <h1>
                        Payments
                    </h1>

                    <p>
                        Manage customer payment collections.
                    </p>
                </div>

                <button
                className="btn btn-dark"
                onClick={()=> navigate("/payments/new")}
                >

                    Collect Payment

                </button>
            </div>

            {
                payments.length === 0 ?
                <div className="card p-4 text-center">

                    No payments found.

                </div>
                :
                payments.map(payment=>(
                    <div
                    className="card p-3 mb-3"
                    key={payment._id}
                    >
                        <h5>
                            Payment
                        </h5>
                        <p>
                            Customer:
                            {" "}
                            {
                                payment.customerId?.name
                                ||
                                "Unknown"
                            }
                        </p>

                        <p>
                            Amount:
                            {" "}
                            {payment.amount}
                        </p>

                        <p>
                            Payment Method:
                            {" "}
                            {payment.paymentMethod}
                        </p>

                        <p>
                            Payment Date:
                            {" "}
                            {
                            new Date(payment.paymentDate)
                            .toLocaleDateString()
                            }
                        </p>

                        <p>
                            Reference:
                            {" "}
                            {
                            payment.referenceNumber
                            ||
                            "N/A"
                            }
                        </p>

                        <p>
                            Collected By:
                            {" "}
                            {payment.collectedBy}
                        </p>

                        <p>
                            Status:
                            {" "}
                            {payment.status}
                        </p>


                        <button
                        className="btn btn-secondary mb-2"
                        onClick={()=>{navigate(`/payments/${payment._id}/edit`)}}
                        >
                            Edit
                        </button>

                        {
                            payment.status === "COMPLETED" &&
                            
                            <button
                            className="btn btn-danger"
                            onClick={()=>{handleCancel(payment._id)}}
                            >

                                Cancel Payment

                            </button>
                        }
                    </div>
                ))
            }
        </div>
    );
}


export default PaymentsPage;