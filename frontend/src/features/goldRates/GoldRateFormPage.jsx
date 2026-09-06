import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createGoldRate } from "./goldRateService";

function GoldRateFormPage(){
    const navigate = useNavigate();
    const [formData,setFormData] = useState({
        purity:"",
        ratePerGram:"",
        effectiveDate:""
    });

    const handleChange=(e)=>{
        setFormData({...formData,[e.target.name]:e.target.value});
    };

    const handleSubmit=async(e)=>{
        e.preventDefault();
        try{
            await createGoldRate(formData);
            navigate("/gold-rates");
        }
        catch(error){
            console.log(error);
        }
    };


    return (
        <div>
            <h1>
                Add Gold Rate
            </h1>

            <form onSubmit={handleSubmit}>
                <input
                className="form-control mb-3"
                placeholder="Purity (Example: 22K)"
                name="purity"
                value={formData.purity}
                onChange={handleChange}
                />

                <input
                className="form-control mb-3"
                placeholder="Rate per gram"
                type="number"
                name="ratePerGram"
                value={formData.ratePerGram}
                onChange={handleChange}
                />

                <input
                className="form-control mb-3"
                type="date"
                name="effectiveDate"
                value={formData.effectiveDate}
                onChange={handleChange}
                />

                <button className="btn btn-dark">
                    Save Gold Rate
                </button>
            </form>
        </div>
    );
}

export default GoldRateFormPage;