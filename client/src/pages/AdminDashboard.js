import React, { useState, useEffect } from "react";
import { ref, onValue, off } from "firebase/database";
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
const [prices, setPrices] = useState({
    Sigalagala: 0,
    Hapung: 0,
    Paranjulu: 0,
    Binanga: 0,
    Portibi: 0
});

    const [vehicles, setVehicles] = useState([]);
    const [search, setSearch] = useState("");
    const [pricePerKg, setPricePerKg] = useState(0);
    const [totalIncome, setTotalIncome] = useState(0); // ✅ Store daily total income
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [selectedOperator, setSelectedOperator] = useState("");
    const uniqueOperators = [...new Set(vehicles.map((v) => v.operator))];
    const [reloadData, setReloadData] = useState(false);

     // ✅ Fetch all timbangans from Firebase
     useEffect(() => {
        const locations = {
            sigalaGala: "Sigalagala/berat",
            hapung: "Hapung/berat",
            paranjulu: "Paranjulu/berat",
            binanga: "Binanga/berat",
            portibi: "Portibi/berat",
        };
    
        // Simpan referensi listener
        const listeners = {};
    
        Object.keys(locations).forEach((key) => {
            const loadCellRef = ref(db, locations[key]);
            
            listeners[key] = onValue(loadCellRef, (snapshot) => {
                if (snapshot.exists()) {
                    setLoadCells((prev) => ({ ...prev, [key]: snapshot.val() }));
                }
            });
        });
    
        // Cleanup: Hapus semua listener saat komponen di-unmount
        return () => {
            Object.keys(listeners).forEach((key) => {
                off(ref(db, locations[key])); // Hapus listener dari Firebase
            });
        };
    }, []);
    

useEffect(() => {
    axios.get(`${API_URL}/api/vehicles`)
        .then((res) => {
            setVehicles(res.data);
            calculateDailyIncome(res.data);
        })
        .catch((err) => console.error("Error fetching vehicles:", err));
}, [reloadData]); // ✅ Refetch when reloadData changes

useEffect(() => {
    const operators = ["Sigalagala", "Hapung", "Paranjulu", "Binanga", "Portibi"];

    Promise.all(
        operators.map(op =>
            axios.get(`${API_URL}/api/price/${op}`)
                .then(res => {
                    const price = Array.isArray(res.data)
                        ? (res.data[0]?.price || 0)
                        : (res.data?.price || 0);
                    return { [op]: price };
                })
                .catch(err => {
                    console.error(`Error fetching price for ${op}:`, err);
                    return { [op]: 0 };
                })
        )
    ).then(results => {
        const newPrices = results.reduce((acc, item) => ({ ...acc, ...item }), {});
        setPrices(newPrices);
    });
}, [reloadData]);



useEffect(() => {
    const interval = setInterval(() => {
        setReloadData(prev => !prev);
    }, 10000); // Refresh setiap 1 menit

    return () => clearInterval(interval); // Hapus interval saat komponen unmount
}, []);

    const [totalNetto, setTotalNetto] = useState(0); // New state for total netto

const calculateDailyIncome = (vehicles) => {
    const today = new Date().toISOString().split("T")[0];

    let dailyTotal = 0;
    let dailyNetto = 0;

    vehicles.forEach(vehicle => {
        if (new Date(vehicle.date).toISOString().split("T")[0] === today) {
            dailyTotal += vehicle.totalPrice || 0;
            if (vehicle.bruto && vehicle.tar) {
                dailyNetto += vehicle.nettobersih;
            }
        }
    });

    setTotalIncome(dailyTotal);
    setTotalNetto(dailyNetto);
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

    const handleClearAll = () => {
        if (window.confirm("Apakah Anda yakin ingin menghapus SEMUA data kendaraan?")) {
            axios.delete(`${API_URL}/api/vehicles`)
                .then(() => {
                    alert("Semua data kendaraan berhasil dihapus!");
                    setVehicles([]); // Kosongkan state setelah penghapusan
                })
                .catch((err) => console.error("Error clearing data:", err));
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
        doc.text("Laporan Timbangan Sawit", 14, 10);
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
    // ✅ Add page numbers
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.text(`Page ${i} of ${totalPages}`, 180, 290);
    }
        doc.save("Laporan_Timbangan_Sawit.pdf");
    };
    
    
    
    return (
        <div className="container mt-4">
            <h2 className="text-center mb-4">Monitor Timbangan Sawit</h2>

           {/* ✅ Cards Section for all timbangans */}
           <div className="row">
                    {Object.entries(loadCells).map(([key, value]) => {
                        const location = key.charAt(0).toUpperCase() + key.slice(1); // Capitalize
                        const harga = prices[location] || 0;

                        return (
                        <div className="col-md-4 mb-3" key={key}>
                            <div className="card text-center">
                            <div className="card-body">
                                <h5 className="card-title">Timbangan {location}</h5>
                                <h3 className="text-primary">{value.toLocaleString()} kg</h3>
                                <h6 className="text-success mt-2">Harga/kg: Rp {harga.toLocaleString()}</h6>
                            </div>
                            </div>
                        </div>
                        );
                    })}

              

                <div className="row justify-content-center">
    <div className="col-md-6">
        <div className="card text-center bg-success text-white">
            <div className="card-body">
                <h5 className="card-title text-white">Total Pembelian Hari Ini</h5>
                <h3>Rp {totalIncome.toLocaleString()}</h3>
                <h5 className="mt-2">Total Netto Hari Ini: {totalNetto.toLocaleString()} Kg</h5>
            </div>
        </div>
    </div>
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
        <button className="btn btn-danger me-2 mb-3" onClick={downloadPDF}>
    📄 Download PDF
</button>

<button className="btn btn-danger mb-3" onClick={handleClearAll}>
    ❌ Hapus Semua Data
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
                            <th>Netto Bersih</th>
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
            const potongannetto = (vehicle.netto * vehicle.discount) / 100;
            const nettobersih = vehicle.netto - potongannetto;
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
                    <td>{nettobersih.toLocaleString() || "-"} Kg</td>
                    
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
