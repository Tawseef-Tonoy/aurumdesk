import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
    updatePayment,
    getCustomers
} from "./paymentService";

import apiClient from "../../api/apiClient";


function PaymentEditPage(){
    const { id } = useParams();
    const navigate = useNavigate();
    const [customers,setCustomers] = useState([]);
    const [formData,setFormData] = useState({
        customerId:"",
        amount:"",
        paymentMethod:"CASH",
        paymentDate:"",
        referenceNumber:"",
        note:"",
        collectedBy:"Admin"
    });

    useEffect(()=>{
        async function loadData(){
            try{
                const paymentResponse =
                await apiClient.get(
                    `/payments/${id}`
                );

                const payment = paymentResponse.data.data;
                const customerResponse = await getCustomers();
                setCustomers(customerResponse.data);
                setFormData({
                    customerId:payment.customerId._id,
                    amount:payment.amount,
                    paymentMethod:payment.paymentMethod,
                    paymentDate:payment.paymentDate.substring(0,10),
                    referenceNumber:payment.referenceNumber || "",
                    note:payment.note || "",
                    collectedBy:payment.collectedBy
                });
            }
            catch(error){
                console.log(error);
            }
        }

        loadData();
    },[id]);


    const handleChange=(e)=>{
        setFormData({
            ...formData, [e.target.name]: e.target.value
        });
    };

    const handleSubmit=async(e)=>{
        e.preventDefault();
        try{
            await updatePayment(id,formData);
            navigate("/payments");
        }
        catch(error){
            console.log(error);
        }
    };

    return (
        <div>
            <h1 className="mb-4">
                Edit Payment
            </h1>

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label>
                        Customer
                    </label>

                    <select
                    className="form-control"
                    name="customerId"
                    value={
                        formData.customerId
                    }
                    onChange={handleChange}
                    >
                        {
                            customers.map(customer=>(
                                <option
                                key={customer._id}
                                value={customer._id}
                                >
                                    {customer.name}
                                </option>
                            ))
                        }
                    </select>
                </div>


                <div className="mb-3">
                    <label>
                        Amount
                    </label>
                    <input
                    className="form-control"
                    type="number"
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

                        <option value="CARD">
                            CARD
                        </option>

                        <option value="BANK_TRANSFER">
                            BANK TRANSFER
                        </option>

                        <option value="MOBILE_BANKING">
                            MOBILE BANKING
                        </option>
                    </select>
                </div>


                <div className="mb-3">
                    <label>
                        Payment Date
                    </label>
                    <input
                    className="form-control"
                    type="date"
                    name="paymentDate"
                    value={formData.paymentDate}
                    onChange={handleChange}
                    />
                </div>


                <div className="mb-3">
                    <label>
                        Reference Number
                    </label>
                    <input
                    className="form-control"
                    name="referenceNumber"
                    value={formData.referenceNumber}
                    onChange={handleChange}
                    />
                </div>

                <div className="mb-3">
                    <label>
                        Note
                    </label>
                    <textarea
                    className="form-control"
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    />
                </div>


                <div className="mb-3">
                    <label>
                        Collected By
                    </label>
                    <input
                    className="form-control"
                    name="collectedBy"
                    value={
                        formData.collectedBy
                    }
                    onChange={handleChange}
                    />
                </div>

                <button className="btn btn-dark">

                    Update Payment

                </button>
            </form>
        </div>
    );
}


export default PaymentEditPage;