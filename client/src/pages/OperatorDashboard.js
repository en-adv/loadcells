import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../firebaseConfig";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css"; // Import Bootstrap

const OperatorDashboard = () => {
    const db = database;
        // State
    const [loadCell, setLoadCell] = useState(0);
    const [plateNumber, setPlateNumber] = useState("");
    const [selectedType, setSelectedType] = useState("Bruto");
    const [vehicles, setVehicles] = useState([]);
    const [search, setSearch] = useState("");
    const [pricePerKg, setPricePerKg] = useState(0);
    const [discount, setDiscount] = useState(0);

    // Fetch Load Cell Data from Firebase
    useEffect(() => {
        const loadCellRef = ref(db, "timbangan/lokasi1/berat");
        onValue(loadCellRef, (snapshot) => {
            if (snapshot.exists()) {
                setLoadCell(snapshot.val());
            }
        });
    }, []);

    // Fetch Vehicle Data from MongoDB
    useEffect(() => {
        axios.get("http://localhost:5000/api/vehicles")
            .then((res) => setVehicles(res.data))
            .catch((err) => console.error("Error fetching vehicles:", err));
    }, []);

    // Fetch Price Data from MongoDB
    useEffect(() => {
        axios.get("http://localhost:5000/api/price")
            .then((res) => {
                if (res.data.length > 0) {
                    setPricePerKg(res.data[0].price);
                }
            })
            .catch((err) => console.error("Error fetching price:", err));
    }, []);

    useEffect(() => {
        axios.get("http://localhost:5000/api/discount")
            .then((res) => {
                if (res.data && res.data.discount !== undefined) {
                    setDiscount(res.data.discount);
                } else {
                    setDiscount(0);
                }
            })
            .catch((err) => console.error("Error fetching discount:", err));
    }, []);

    // Submit Weight Data
    const handleSubmit = () => {
        if (!plateNumber) {
            alert("Masukkan Nomor Kendaraan");
            return;
        }

        const payload = {
            plateNumber,
            weight: loadCell,
            type: selectedType,
            pricePerKg,
            discount
        };

        axios.post("http://localhost:5000/api/vehicles", payload)
            .then(() => {
                setPlateNumber("");
                axios.get("http://localhost:5000/api/vehicles").then(res => setVehicles(res.data));
            })
            .catch(err => console.error("Error submitting data:", err));
    };

    return (
        <div className="container mt-4">
            <h2 className="text-center mb-4">Monitor Timbangan Sawit</h2>

            {/* Cards Section */}
            <div className="row">
                <div className="col-md-4 mb-3">
                    <div className="card text-center">
                        <div className="card-body">
                            <h5 className="card-title">Timbangan Sigala-gala</h5>
                            <h3 className="text-primary">{loadCell.toLocaleString()} kg</h3>
                        </div>
                    </div>
                </div>

                <div className="col-md-4 mb-3">
                    <div className="card text-center">
                        <div className="card-body">
                            <h5 className="card-title">Harga/kg</h5>
                            <h3 className="text-success">Rp {pricePerKg.toLocaleString()}</h3>
                        </div>
                    </div>
                </div>

                <div className="col-md-4 mb-3">
                    <div className="card text-center">
                        <div className="card-body">
                            <h5 className="card-title">Potongan Harga</h5>
                            <h3 className="text-danger">{discount ? `${discount}%` : "0%"}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Input Section */}
            <div className="row">
                <div className="col-md-6">
                    <label>No Kendaraan:</label>
                    <input
                        type="text"
                        className="form-control"
                        value={plateNumber}
                        onChange={(e) => setPlateNumber(e.target.value.toUpperCase().replace(/\s/g, ""))}
                    />
                </div>

                <div className="col-md-4">
                    <label>Pilih Jenis Berat:</label>
                    <select
                        className="form-select"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                    >
                        <option value="Bruto">Bruto</option>
                        <option value="Tar">Tar</option>
                    </select>
                </div>

                <div className="col-md-2 d-grid">
                <button className="btn kirim-button mt-4" onClick={handleSubmit}>KIRIM</button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mt-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Cari Nomor Kendaraan"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Vehicle Table */}
            <h4 className="mt-2">Kendaraan Terdaftar</h4>
            <div className="table-responsive">
                 <table className="table custom-table">
               <thead className="custom-thead">    
                        <tr>
                            <th>Nomor Plat</th>
                            <th>Bruto (kg)</th>
                            <th>Tar (kg)</th>
                            <th>Netto (kg)</th>
                            <th>Diskon %</th>
                            <th>Total Harga (Rp)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vehicles
                            .filter(vehicle => vehicle.plateNumber.includes(search.toUpperCase()))
                            .map((vehicle, index) => {
                                const netto = vehicle.bruto && vehicle.tar ? vehicle.bruto - vehicle.tar : 0;
                                const totalPrice = netto * pricePerKg;
                                const discountAmount = (totalPrice * discount) / 100;
                                const finalPrice = totalPrice - discountAmount;

                                return (
                                    <tr key={index}>
                                        <td>{vehicle.plateNumber}</td>
                                        <td>{vehicle.bruto || "-"} Kg</td>
                                        <td>{vehicle.tar || "-"} Kg</td>
                                        <td>{netto || "-"} Kg</td>  
                                        <td>{vehicle.discount || "0"}%</td>
                                        <td>Rp {finalPrice.toLocaleString()}</td>
                                    </tr>
                                );
                            })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OperatorDashboard;
