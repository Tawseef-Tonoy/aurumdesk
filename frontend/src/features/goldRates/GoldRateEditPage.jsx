import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "../../api/apiClient";


function GoldRateEditPage(){
    const {id} = useParams();
    const navigate = useNavigate();
    const [formData,setFormData] = useState({
        purity:"",
        ratePerGram:"",
        effectiveDate:""
    });

    useEffect(()=>{
        async function loadRate(){
            try{
                const response = await apiClient.get(`/gold-rates/${id}`);
                const rate = response.data.data;

                setFormData({
                    purity: rate.purity,
                    ratePerGram: rate.ratePerGram,
                    effectiveDate:
                    rate.effectiveDate.substring(0,10)
                });
            }
            catch(error){
                console.log(error);
            }
        }
        loadRate();
    },[id]);

    const handleChange=(e)=>{
        setFormData({...formData,[e.target.name]:e.target.value});
    };

    const handleSubmit=async(e)=>{
        e.preventDefault();
        await apiClient.patch(`/gold-rates/${id}`,formData);
        navigate("/gold-rates");
    };

    return (
        <div>
            <h1>
                Edit Gold Rate
            </h1>

            <form onSubmit={handleSubmit}>
                <input
                className="form-control mb-3"
                name="purity"
                value={formData.purity}
                onChange={handleChange}
                />

                <input
                className="form-control mb-3"
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
                    Update
                </button>
            </form>
        </div>
    );
}

export default GoldRateEditPage;