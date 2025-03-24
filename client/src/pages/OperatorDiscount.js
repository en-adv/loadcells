import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

const API_URL = process.env.REACT_APP_API_URL;

const OperatorDiscount = () => {
    const [discount, setDiscount] = useState(0);
    const [operator, setOperator] = useState("");

    // Fetch logged-in operator role
    useEffect(() => {
        const storedRole = localStorage.getItem("role");
        const validOperators = ["Sigalagala", "Hapung", "Paranjulu", "Binanga", "Portibi"];
        if (storedRole && validOperators.includes(storedRole)) {
            setOperator(storedRole);
        }
    }, []);

    // Fetch the discount for the logged-in operator
    useEffect(() => {
        if (operator) {
            axios.get(`${API_URL}/api/discount/${operator}`)
                .then((res) => {
                    if (res.data && res.data.discount !== undefined) {
                        setDiscount(res.data.discount);
                    }
                })
                .catch((err) => console.error("Error fetching discount:", err));
        }
    }, [operator]);

    // Submit discount for the logged-in operator
    const handleDiscountSubmit = () => {
        axios.post(`${API_URL}/api/discount`, { discount, from: operator })
            .then(() => alert("Diskon diperbarui!"))
            .catch(err => console.error("Error submitting discount:", err));
    };

    return (
        <div className="container mt-4">
            <h2 className="text-center mb-4">Atur Potongan Harga</h2>

            <div className="row justify-content-center">
                <div className="col-md-4 mb-3">
                    <div className="card text-center shadow">
                        <div className="card-body">
                            <h5 className="card-title fw-bold">Potongan Harga ({operator})</h5>
                            <h3 className="text-danger">{discount ? `${discount}%` : "0%"}</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card shadow">
                <div className="card-body">
                    <label className="form-label fw-bold">Potongan Harga (%)</label>
                    <input
                        type="number"
                        className="form-control"
                        value={discount}
                        onChange={(e) => setDiscount(Number(e.target.value))}
                    />
                    <button 
                        className="btn mt-3 w-100"
                        style={{ backgroundColor: "#2D336B", color: "white" }}
                        onClick={handleDiscountSubmit}
                    >
                        Simpan
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OperatorDiscount;
