import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../firebaseConfig";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

jsPDF.API.autoTable = autoTable;


const API_URL = process.env.REACT_APP_API_URL;

const AdminDashboard = () => {
    const db = database;
 // ✅ Store all timbangans in one state
 const [loadCells, setLoadCells] = useState({
    sigalaGala: 0,
    hapung: 0,
    paranjulu: 0,
    binanga: 0,
    portibi: 0,
});

    const [plateNumber, setPlateNumber] = useState("");
    const [vehicles, setVehicles] = useState([]);
    const [search, setSearch] = useState("");
    const [pricePerKg, setPricePerKg] = useState(0);
    const [totalIncome, setTotalIncome] = useState(0); // ✅ Store daily total income
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [selectedOperator, setSelectedOperator] = useState("");
    const uniqueOperators = [...new Set(vehicles.map((v) => v.operator))];

     // ✅ Fetch all timbangans from Firebase
     useEffect(() => {
        const locations = {
            sigalaGala: "timbangan/Sigalagala/berat",
            hapung: "timbangan/Hapung/berat",
            paranjulu: "timbangan/Paranjulu/berat",
            binanga: "timbangan/Binanga/berat",
            portibi: "timbangan/Portibi/berat",
        };

        Object.keys(locations).forEach((key) => {
            const loadCellRef = ref(db, locations[key]);
            onValue(loadCellRef, (snapshot) => {
                if (snapshot.exists()) {
                    setLoadCells((prev) => ({ ...prev, [key]: snapshot.val() }));
                }
            });
        });
    }, []);

    // Fetch Vehicle Data from MongoDB
    useEffect(() => {
        axios.get(`${API_URL}/api/vehicles`)
            .then((res) => {
                setVehicles(res.data);
                calculateDailyIncome(res.data); // ✅ Calculate total income
            })
            .catch((err) => console.error("Error fetching vehicles:", err));
    }, []);

    // Fetch Latest Price Data from MongoDB
    useEffect(() => {
        axios.get(`${API_URL}/api/price`)
            .then((res) => {
                if (res.data.length > 0) {
                    setPricePerKg(res.data[0].price);
                }
            })
            .catch((err) => console.error("Error fetching price:", err));
    }, []);

    // Function to calculate total income for the day
    const calculateDailyIncome = (vehicles) => {
        const today = new Date().toISOString().split("T")[0]; // Get today's date (YYYY-MM-DD)
        const dailyTotal = vehicles
            .filter(vehicle => new Date(vehicle.date).toISOString().split("T")[0] === today) // ✅ Filter today's records
            .reduce((sum, vehicle) => sum + (vehicle.totalPrice || 0), 0); // ✅ Sum up totalPrice
        
        setTotalIncome(dailyTotal);
    };

    const handlePriceUpdate = () => {
        axios.post(`${API_URL}/api/price`, { 
            price: Number(pricePerKg), 
            date: new Date().toISOString()  // ✅ Store timestamp correctly
        }) 
        .then(() => alert("Harga baru telah disimpan!"))
        .catch(err => console.error("Error saving new price:", err));
    };

    const handleEdit = (vehicle) => {
        setEditingVehicle(vehicle);
    };
    
    const handleUpdate = (id) => {
        axios.put(`${API_URL}/api/vehicles/${id}`, editingVehicle)
            .then(() => {
                alert("Data berhasil diperbarui!");
                setEditingVehicle(null);
                window.location.reload(); // Refresh data
            })
            .catch((err) => console.error("Error updating vehicle:", err));
    };

    const handleDelete = (id) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus data ini?")) {
            axios.delete(`${API_URL}/api/vehicles/${id}`)
                .then(() => {
                    alert("Data berhasil dihapus!");
                    setVehicles(vehicles.filter(vehicle => vehicle._id !== id));
                })
                .catch((err) => console.error("Error deleting vehicle:", err));
        }
    };
    const downloadPDF = () => {
        const doc = new jsPDF();
        
        // Daftar lokasi dalam urutan yang diinginkan
        const locationOrder = ["Hapung", "Paranjulu", "Portibi", "Binanga", "Sigalagala"];
    
        // Filter dan urutkan data berdasarkan lokasi
        const sortedVehicles = vehicles
            .filter(vehicle => locationOrder.includes(vehicle.operator))
            .sort((a, b) => locationOrder.indexOf(a.operator) - locationOrder.indexOf(b.operator));
    
        // Attach autoTable explicitly with smaller font size
        autoTable(doc, {
            head: [["Tanggal", "No Polisi", "Brutto", "Tar", "Netto", "Potongan", "Harga/Kg", "Netto x Harga", "Total", "Lokasi"]],
            
            body: sortedVehicles.map(vehicle => [
                vehicle.date ? new Date(vehicle.date).toLocaleString("id-ID") : "-",
                vehicle.plateNumber,
                ` ${vehicle.bruto?.toLocaleString() || "-"} Kg`,
                ` ${vehicle.tar?.toLocaleString() || "-"} Kg`,
                ` ${vehicle.bruto && vehicle.tar ? (vehicle.bruto - vehicle.tar).toLocaleString() : "-"} Kg`,
                ` ${vehicle.discount !== undefined ? vehicle.discount : "0"} %`,
                `Rp ${vehicle.pricePerKg.toLocaleString()}`,
                vehicle.bruto && vehicle.tar ? `Rp ${((vehicle.bruto - vehicle.tar) * vehicle.pricePerKg).toLocaleString()}` : "-",
                `Rp ${vehicle.totalPrice.toLocaleString()}`,
                vehicle.operator
            ]),
            startY: 5,
            styles: {
                fontSize: 8, 
            },
            headStyles: {
                fontSize: 9, 
                fillColor: [45, 51, 107], 
                textColor: 255, 
            },
            bodyStyles: {
                fontSize: 8, 
            }
        });
    
        doc.save("Laporan_Timbangan_Sawit.pdf");
    };
    
    
    
    return (
        <div className="container mt-4">
            <h2 className="text-center mb-4">Monitor Timbangan Sawit</h2>

           {/* ✅ Cards Section for all timbangans */}
           <div className="row">
                {Object.entries(loadCells).map(([key, value]) => (
                    <div className="col-md-4 mb-3" key={key}>
                        <div className="card text-center">
                            <div className="card-body">
                                <h5 className="card-title">
                                    Timbangan {key.charAt(0).toUpperCase() + key.slice(1)}
                                </h5>
                                <h3 className="text-primary">{value.toLocaleString()} kg</h3>
                            </div>
                        </div>
                    </div>
                ))}

                {/* ✅ Harga per kg */}
                <div className="col-md-4 mb-3">
                    <div className="card text-center">
                        <div className="card-body">
                            <h5 className="card-title">Harga/kg</h5>
                            <h3 className="text-success">Rp {pricePerKg.toLocaleString()}</h3>
                        </div>
                    </div>
                </div>

                {/* ✅ Total Pendapatan Hari Ini */}
                <div className="row justify-content-center">
        <div className="col-md-6">
            <div className="card text-center bg-success text-white">
                <div className="card-body">
                    <h5 className="card-title text-white">Total Pendapatan Hari Ini</h5>
                    <h3>Rp {totalIncome.toLocaleString()}</h3>
                </div>
            </div>
        </div>
    </div>
            </div>

            {/* Editable Price Input */}
            <h5 className="mt-3">Update Harga per kg</h5>
            <div className="input-group mb-3">
                <input
                    type="number"
                    className="form-control"
                    value={pricePerKg}
                    onChange={(e) => setPricePerKg(e.target.value)}
                    min="0"
                />
                <button className="btn btn-primary " onClick={handlePriceUpdate}>
                    Ubah Harga
                </button>
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
            {/* Dropdown to Select Operator */}
        <div className="mb-3">
            <label className="form-label">Filter by Operator:</label>
            <select
                className="form-select"
                value={selectedOperator}
                onChange={(e) => setSelectedOperator(e.target.value)}
            >
                <option value="">All Operators</option>
                {uniqueOperators.map((operator, index) => (
                    <option key={index} value={operator}>{operator}</option>
                ))}
            </select>
        </div>
        <button className="btn btn-danger mb-3" onClick={downloadPDF}>
    📄 Download PDF
</button>

            {/* Vehicle Table */}
            <h4 className="mt-2">Kendaraan Terdaftar</h4>
            <div className="table-responsive">
                <table className="table custom-table">
                    <thead className="custom-thead">    
                        <tr>
                            <th>Tanggal</th>
                            <th>No Polisi</th>
                            <th>Bruto</th>
                            <th>Tar</th>
                            <th>Netto</th>
                            <th>Potongan</th>
                            <th>Harga</th>
                            <th>Netto x Harga</th>
                            <th>Total</th>
                            <th>Lokasi</th>

                        </tr>
                    </thead>
                    <tbody>
    {vehicles
        .filter(vehicle => 
            (selectedOperator === "" || vehicle.operator === selectedOperator) // Filter by operator
        )
        .filter(vehicle => vehicle.plateNumber.includes(search.toUpperCase()))
        .map((vehicle, index) => {
            const isEditing = editingVehicle && editingVehicle._id === vehicle._id;

            const formattedDate = vehicle.date
            ? new Date(vehicle.date).toLocaleDateString("id-ID", { 
                day: "2-digit", 
                month: "2-digit", 
                year: "numeric", 
                hour: "2-digit", 
                minute: "2-digit", 
                second: "2-digit" 
              }) 
            : "-";

            return (
                <tr key={index}>

                <td>{formattedDate}</td>
                    <td>
                        {isEditing ? (
                            <input 
                                type="text"
                                value={editingVehicle.plateNumber}
                                onChange={(e) => setEditingVehicle({ ...editingVehicle, plateNumber: e.target.value })}
                                className="form-control"
                            />
                        ) : vehicle.plateNumber}
                    </td>
                    <td>
                        {isEditing ? (
                            <input 
                                type="number"
                                value={editingVehicle.bruto}
                                onChange={(e) => setEditingVehicle({ ...editingVehicle, bruto: e.target.value })}
                                className="form-control"
                            />
                        ) : `${vehicle.bruto || "-"} Kg`}
                    </td>
                    <td>
                        {isEditing ? (
                            <input 
                                type="number"
                                value={editingVehicle.tar}
                                onChange={(e) => setEditingVehicle({ ...editingVehicle, tar: e.target.value })}
                                className="form-control"
                            />
                        ) : `${vehicle.tar || "-"} Kg`}
                    </td>
                    <td>{(vehicle.bruto && vehicle.tar) ? `${vehicle.bruto - vehicle.tar} Kg` : "-"}</td>
                    <td>
                        {isEditing ? (
                            <input 
                                type="number"
                                value={editingVehicle.discount}
                                onChange={(e) => setEditingVehicle({ ...editingVehicle, discount: e.target.value })}
                                className="form-control"
                            />
                        ) : `${vehicle.discount !== undefined ? vehicle.discount : "0"}%`}
                    </td>
                    <td>
                        {isEditing ? (
                            <input 
                                type="number"
                                value={editingVehicle.pricePerKg}
                                onChange={(e) => setEditingVehicle({ ...editingVehicle, pricePerKg: e.target.value })}
                                className="form-control"
                            />
                        ) : `Rp ${vehicle.pricePerKg.toLocaleString()}`}
                    </td>
                    <td>Rp {(vehicle.bruto && vehicle.tar) ? ((vehicle.bruto - vehicle.tar) * vehicle.pricePerKg).toLocaleString() : "-"}</td>
                    
                    <td>Rp {vehicle.totalPrice.toLocaleString()}</td>
                    <td> {vehicle.operator}</td>

                    {/* ✅ Action Buttons */}
                    <td>
                        {isEditing ? (
                            <>
                                <button className="btn btn-success btn-sm me-2" onClick={() => handleUpdate(vehicle._id)}>✔ Simpan</button>
                                <button className="btn btn-secondary btn-sm" onClick={() => setEditingVehicle(null)}>✖ Batal</button>
                            </>
                        ) : (
                            <>
                                <button className="btn btn-warning btn-sm me-2" onClick={() => handleEdit(vehicle)}>✏ Edit</button>
                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(vehicle._id)}>🗑 Hapus</button>
                            </>
                        )}
                    </td>
                </tr>
            );
        })}
</tbody>

                </table>
            </div>
        </div>
    );
};

export default AdminDashboard;
