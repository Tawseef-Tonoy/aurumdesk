import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {getGoldRates,activateGoldRate,deactivateGoldRate} from "./goldRateService";

function GoldRatesPage() {
    const [goldRates, setGoldRates] = useState([]);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    async function loadGoldRates() {
        try {
            const response = await getGoldRates();
            setGoldRates(response.data);
        } catch (err) {
            console.log(err);
            setError("Failed to load gold rates");
        }
    }

    useEffect(() => {
        loadGoldRates();
    }, []);


    async function handleActivate(id) {
        try {
            await activateGoldRate(id);
            loadGoldRates();
        } catch(err) {
            console.log(err);
        }
    }

    async function handleDeactivate(id) {
        try {
            await deactivateGoldRate(id);
            loadGoldRates();
        } catch(err) {
            console.log(err);
        }
    }


    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1>
                        Gold Rates
                    </h1>

                    <p>
                        Manage daily gold prices.
                    </p>
                </div>

                <button
                className="btn btn-dark"
                onClick={() =>navigate("/gold-rates/new")}
                >
                    Add Gold Rate
                </button>
            </div>

            {
                error &&
                <div className="alert alert-danger">
                    {error}
                </div>
            }

            {
                goldRates.length === 0 ?
                <div className="card p-4 text-center">
                    No gold rates found.
                </div>
                :
                goldRates.map((rate)=>(
                    <div
                    className="card p-3 mb-3"
                    key={rate._id}
                    >

                        <h5>
                            Gold Rate
                        </h5>

                        <p>
                            Purity: {rate.purity}
                        </p>

                        <p>
                            Rate Per Gram: {rate.ratePerGram}
                        </p>

                        <p>
                            Effective Date: {new Date(rate.effectiveDate).toISOString()}
                        </p>

                        <p>
                            Status:
                            {
                                rate.isActive
                                ?
                                <span className="text-success">
                                    {" "}ACTIVE
                                </span>
                                :
                                <span className="text-danger">
                                    {" "}INACTIVE
                                </span>
                            }
                        </p>

                        <button
                        className="btn btn-secondary mb-2"
                        onClick={()=>{navigate(`/gold-rates/${rate._id}/edit`)}}
                        >
                            Edit
                        </button>

                        {
                            rate.isActive ?
                            <button
                            className="btn btn-warning"
                            onClick={()=>{handleDeactivate(rate._id)}}
                            >
                                Deactivate
                            </button>
                            :
                            <button
                            className="btn btn-success"
                            onClick={()=>{handleActivate(rate._id)}}
                            >
                                Activate
                            </button>
                        }
                    </div>
                ))
            }
        </div>
    );
}

export default GoldRatesPage;