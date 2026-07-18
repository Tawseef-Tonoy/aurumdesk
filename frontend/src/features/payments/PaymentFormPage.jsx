import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {createPayment, getCustomers} from "./paymentService";

function PaymentFormPage(){
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
        async function loadCustomers(){
            try{
                const response = await getCustomers();
                setCustomers(response.data);
            }
            catch(error){
                console.log(error);
            }
        }
        loadCustomers();
    },[]);

    const handleChange=(e)=>{
        setFormData({ ...formData,[e.target.name]:e.target.value});
    };

    const handleSubmit=async(e)=>{
        e.preventDefault();
        try{
            await createPayment(formData);
            navigate("/payments");
        }
        catch(error){
            console.log(error);
        }
    };


    return (
        <div>
            <h1 className="mb-4">
                Collect Payment
            </h1>

            <form onSubmit={handleSubmit}>

                <div className="mb-3">
                    <label>
                        Customer
                    </label>

                    <select
                    className="form-control"
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleChange}
                    >
                        <option value="">
                            Select Customer
                        </option>

                        {
                            customers.map(customer=>(
                                <option
                                key={customer._id}
                                value={customer._id}
                                >
                                    {
                                        customer.name
                                    }
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
                    type="date"
                    className="form-control"
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
                    value={formData.collectedBy}
                    onChange={handleChange}
                    />
                </div>

                <button className="btn btn-dark">
                    Save Payment
                </button>
            </form>
        </div>
    );
}

export default PaymentFormPage;