import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../firebaseConfig";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css"; // Import Bootstrap
const API_URL = process.env.REACT_APP_API_URL;
const OperatorDashboard1 = () => {
    const db = database;
    const nama = "sigala-gala";
        // State
    const [loadCell, setLoadCell] = useState(0);
    const [plateNumber, setPlateNumber] = useState("");
    const [selectedType, setSelectedType] = useState("Bruto");
    const [vehicles, setVehicles] = useState([]);
    const [search, setSearch] = useState("");
    const [pricePerKg, setPricePerKg] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [totalNetto, setTotalNetto] = useState(0);
    const [showNotification, setShowNotification] = useState(false);

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
        axios.get(`${API_URL}/api/vehicles`)
            .then((res) => setVehicles(res.data))
            .catch((err) => console.error("Error fetching vehicles:", err));
    }, []);

    // Fetch Price Data from MongoDB
    useEffect(() => {
        axios.get(`${API_URL}/api/price`)
            .then((res) => {
                if (res.data.length > 0) {
                    setPricePerKg(res.data[0].price);
                }
            })
            .catch((err) => console.error("Error fetching price:", err));
    }, []);

    useEffect(() => {
        const operator = "operator1";  // Make sure it's dynamically assigned
        axios.get(`${API_URL}/api/discount/${operator}`)
            .then((res) => {
                console.log("Fetched Discount Response:", res.data); // Debugging
                if (res.data && res.data.discount !== undefined) {
                    setDiscount(res.data.discount);
                } else {
                    setDiscount(0);
                }
            })
            .catch((err) => console.error("Error fetching discount:", err));
    }, []);

    useEffect(() => {
        const operator = "operator1"; // Ensure this is dynamically set later
        const total = vehicles
            .filter(vehicle => vehicle.operator === operator)
            .reduce((sum, vehicle) => sum + (vehicle.bruto && vehicle.tar ? vehicle.bruto - vehicle.tar : 0), 0);
    
        setTotalNetto(total);
    
        const lastThreshold = parseInt(localStorage.getItem("lastThreshold") || "0", 10);
        const nextThreshold = Math.floor(total / 10000) * 10000; // Fix threshold logic
    
    
        if (total >= nextThreshold && nextThreshold > lastThreshold) {
            console.log("🎉 Showing notification!");
            setShowNotification(true);
            localStorage.setItem("lastThreshold", nextThreshold.toString());
        }
    }, [vehicles]);
    

    const handleNotificationDismiss = () => {
        setShowNotification(false);
    };
    
    
    // Submit Weight Data
    const handleSubmit = () => {
        if (!plateNumber) {
            alert("Masukkan Nomor Kendaraan");
            return;
        }
    
        const operator = "operator1";  // ✅ Replace this with actual logged-in operator
    
        const payload = {
            plateNumber,
            weight: loadCell,
            type: selectedType,
            pricePerKg,
            discount,
            operator,// ✅ Send operator field
        };
    
        axios.post(`${API_URL}/api/vehicles`, payload)
            .then(() => {
                setPlateNumber("");
                axios.get(`${API_URL}/api/vehicles`).then(res => setVehicles(res.data));
            })
            .catch(err => console.error("Error submitting data:", err));
    };
    

    return (
        <div className="container mt-4">
            <h2 className="text-center mb-4">Monitor Timbangan Sawit</h2>
             
              {/* Notification Modal */}
              {showNotification && (
                <div className="modal fade show d-block" tabIndex="-1" role="dialog">
                    <div className="modal-dialog" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Pemberitahuan !!</h5>
                            </div>
                            <div className="modal-body">
                                <p>Total berat sawit <strong>{totalNetto.toLocaleString()}</strong> kg! dan telah mencapai lebih dari 10 Ton.</p>
                                <p>Silahkan timbang muatan tronton.</p>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-primary" onClick={handleNotificationDismiss}>
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


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
                            <th>Harga</th>
                            <th>Netto X Harga</th>
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
                                const discountAmount = (totalPrice * {discount}) / 100;
                                const finalPrice = vehicle.totalPrice - discountAmount;
                                const harga = netto * vehicle.pricePerKg;
                                return (
                                    <tr key={index}>
                                        <td>{vehicle.plateNumber}</td>
                                        <td>{vehicle.bruto || "-"} Kg</td>
                                        <td>{vehicle.tar || "-"} Kg</td>
                                        <td>{netto || "-"} Kg</td> 
                                        <td>Rp {vehicle.pricePerKg.toLocaleString() || "-"}</td> 
                                        <td>Rp {harga.toLocaleString() || "-"}</td>
                                        <td>{vehicle.discount !== undefined ? vehicle.discount : "0"}%</td>

                                        <td>Rp {vehicle.totalPrice.toLocaleString()}</td>
                                    </tr>
                                );
                            })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OperatorDashboard1;
