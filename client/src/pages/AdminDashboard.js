import React, { useState, useEffect } from "react";
import { ref, onValue, off } from "firebase/database";
import { database } from "../firebaseConfig";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { checkSession, updateLastActivity, clearSession } from '../utils/sessionManager';
import { FaSearch, FaSort, FaSortUp, FaSortDown, FaSave, FaTrash, FaEdit, FaFileExcel, FaSignOutAlt } from "react-icons/fa";
import * as XLSX from 'xlsx';


jsPDF.API.autoTable = autoTable;


const API_URL = process.env.REACT_APP_API_URL;

const statusMessages = {
    connected: {
        message: 'Terhubung',
        color: 'success',
        icon: '✅'
    },
    idle: {
        message: 'Timbangan Kosong',
        color: 'success',
        icon: '✅'
    },
    staleData: {
        message: 'Data tidak diperbarui > 1 menit',
        color: 'warning',
        icon: '⚠️'
    },
    connectionError: {
        message: 'Gagal terhubung ke timbangan',
        color: 'danger',
        icon: '❌'
    },
    noData: {
        message: 'Tidak ada data dari timbangan',
        color: 'danger',
        icon: '❌'
    },
    sessionExpired: {
        message: 'Sesi telah berakhir, silakan login ulang',
        color: 'danger',
        icon: '❌'
    }
};

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
    const [totalIncome, setTotalIncome] = useState(0); // ✅ Store daily total income
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [selectedOperator, setSelectedOperator] = useState("");
    const uniqueOperators = [...new Set(vehicles.map((v) => v.operator))];
    const [reloadData, setReloadData] = useState(false);
    const [rekapPerOperator, setRekapPerOperator] = useState({});
    const [connectionStatus, setConnectionStatus] = useState({});
    const [lastUpdate, setLastUpdate] = useState({});
    const [totalNetto, setTotalNetto] = useState(0);
    const [totalNettoBersih, setTotalNettoBersih] = useState(0);
    const [totalHarga, setTotalHarga] = useState(0);

    // Add connection status check
    useEffect(() => {
        const locations = {
            sigalaGala: "Sigalagala/berat",
            hapung: "Hapung/berat",
            paranjulu: "Paranjulu/berat",
            binanga: "Binanga/berat",
            portibi: "Portibi/berat",
        };
    
        const listeners = {};
        const lastUpdateTimes = {};
    
        Object.keys(locations).forEach((key) => {
            const loadCellRef = ref(db, locations[key]);
            
            listeners[key] = onValue(loadCellRef, (snapshot) => {
                if (snapshot.exists()) {
                    setLoadCells((prev) => ({ ...prev, [key]: snapshot.val() }));
                    setConnectionStatus(prev => ({ ...prev, [key]: 'connected' }));
                    lastUpdateTimes[key] = Date.now();
                    setLastUpdate(prev => ({ ...prev, [key]: Date.now() }));
                } else {
                    setConnectionStatus(prev => ({ ...prev, [key]: 'no-data' }));
                }
            }, (error) => {
                console.error(`Error in ${key} connection:`, error);
                setConnectionStatus(prev => ({ ...prev, [key]: 'error' }));
            });
        });
    
        // Check for stale data every minute
        const intervalId = setInterval(() => {
            Object.keys(locations).forEach((key) => {
                const lastUpdateTime = lastUpdateTimes[key];
                if (lastUpdateTime && Date.now() - lastUpdateTime > 60000) { // 1 minute
                    setConnectionStatus(prev => ({ ...prev, [key]: 'stale' }));
                }
            });
        }, 60000);
    
        return () => {
            Object.keys(listeners).forEach((key) => {
                off(ref(db, locations[key]));
            });
            clearInterval(intervalId);
        };
    }, []);

    // Add session check on component mount
    useEffect(() => {
        if (!checkSession()) {
            return;
        }

        // Update activity on user interaction
        const handleUserActivity = () => {
            updateLastActivity();
        };

        // Add event listeners for user activity
        window.addEventListener('mousemove', handleUserActivity);
        window.addEventListener('keydown', handleUserActivity);
        window.addEventListener('click', handleUserActivity);

        // Check session periodically
        const sessionCheckInterval = setInterval(() => {
            if (!checkSession()) {
                clearInterval(sessionCheckInterval);
            }
        }, 60000); // Check every minute

        return () => {
            window.removeEventListener('mousemove', handleUserActivity);
            window.removeEventListener('keydown', handleUserActivity);
            window.removeEventListener('click', handleUserActivity);
            clearInterval(sessionCheckInterval);
        };
    }, []);

    // Function to get status message and color
    const getStatusInfo = (key) => {
        const status = connectionStatus[key];
        const lastUpdateTime = lastUpdate[key];
        
        // Check session first
        if (!checkSession()) {
            return statusMessages.sessionExpired;
        }

        // Check connection status
        switch (status) {
            case 'connected':
                // If connected and value is 0, show as idle instead of error
                if (loadCells[key] === 0) {
                    return statusMessages.idle;
                }
                return statusMessages.connected;
            case 'stale':
                return statusMessages.staleData;
            case 'error':
                return statusMessages.connectionError;
            case 'no-data':
                return statusMessages.noData;
            default:
                // If value exists but is 0, show as idle
                if (loadCells[key] === 0) {
                    return statusMessages.idle;
                }
                return statusMessages.connected;
        }
    };

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
        const rekap = {};

        vehicles.forEach(vehicle => {
            const operator = vehicle.operator;

            if (!rekap[operator]) {
                rekap[operator] = {
                    netto: 0,
                    nettoBersih: 0,
                    total: 0,
                };
            }

            const netto = vehicle.bruto && vehicle.tar ? vehicle.bruto - vehicle.tar : 0;
            const discount = vehicle.discount || 0;
            const nettoBersih = Math.round(netto - ((netto * discount) / 100));
            
            rekap[operator].netto += netto;
            rekap[operator].nettoBersih += nettoBersih;
            rekap[operator].total += vehicle.totalPrice || 0;
        });

        setRekapPerOperator(rekap);
    }, [vehicles]);

    useEffect(() => {
        const interval = setInterval(() => {
            setReloadData(prev => !prev);
        }, 10000); // Refresh setiap 1 menit

        return () => clearInterval(interval); // Hapus interval saat komponen unmount
    }, []);

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

    useEffect(() => {
        // Calculate totals whenever vehicles data changes
        let nettoTotal = 0;
        let nettoBersihTotal = 0;
        let hargaTotal = 0;

        vehicles.forEach(vehicle => {
            const netto = vehicle.bruto && vehicle.tar ? vehicle.bruto - vehicle.tar : 0;
            const potongannetto = (netto * (vehicle.discount || 0)) / 100;
            const nettobersih = Math.round(netto - potongannetto);
            
            nettoTotal += netto;
            nettoBersihTotal += nettobersih;
            hargaTotal += vehicle.totalPrice || 0;
        });

        setTotalNetto(nettoTotal);
        setTotalNettoBersih(nettoBersihTotal);
        setTotalHarga(hargaTotal);
    }, [vehicles]);

    const handleEdit = (vehicle) => {
        // Calculate initial values if not present
        const netto = vehicle.bruto && vehicle.tar ? vehicle.bruto - vehicle.tar : 0;
        const potongannetto = (netto * (vehicle.discount || 0)) / 100;
        const nettobersih = Math.round(netto - potongannetto);
        const totalPrice = nettobersih * (vehicle.pricePerKg || 0);

        setEditingVehicle({
            ...vehicle,
            netto: netto,
            nettobersih: nettobersih,
            totalPrice: totalPrice
        });
    };
    
    const handleUpdate = (id) => {
        // Recalculate values before updating
        const netto = editingVehicle.bruto && editingVehicle.tar ? 
            editingVehicle.bruto - editingVehicle.tar : 
            editingVehicle.netto || 0;
        
        const potongannetto = (netto * (editingVehicle.discount || 0)) / 100;
        const nettobersih = Math.round(netto - potongannetto);
        const totalPrice = nettobersih * (editingVehicle.pricePerKg || 0);

        const updatedVehicle = {
            ...editingVehicle,
            netto: netto,
            nettobersih: nettobersih,
            totalPrice: totalPrice
        };

        axios.put(`${API_URL}/api/vehicles/${id}`, updatedVehicle)
            .then(() => {
                alert("Data berhasil diperbarui!");
                setEditingVehicle(null);
                window.location.reload();
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
    
        const locationOrder = ["Hapung", "Paranjulu", "Portibi", "Binanga", "Sigalagala"];
    
        const sortedVehicles = vehicles
            .filter(vehicle => locationOrder.includes(vehicle.operator))
            .sort((a, b) => locationOrder.indexOf(a.operator) - locationOrder.indexOf(b.operator));
    
        // Hitung total kolom
        let totalNettoKotor = 0;
        let totalNettoBersih = 0;
        let totalHarga = 0;
    
        sortedVehicles.forEach(vehicle => {
            const nettoKotor = vehicle.bruto && vehicle.tar ? (vehicle.bruto - vehicle.tar) : 0;
            const nettoBersih = vehicle.nettobersih || 0;
            const total = vehicle.totalPrice || 0;
    
            totalNettoKotor += nettoKotor;
            totalNettoBersih += nettoBersih;
            totalHarga += total;
        });
    
        const tableBody = sortedVehicles.map(vehicle => [
            vehicle.date ? new Date(vehicle.date).toLocaleString("id-ID") : "-",
            vehicle.plateNumber,
            ` ${vehicle.bruto?.toLocaleString() || "-"} Kg`,
            ` ${vehicle.tar?.toLocaleString() || "-"} Kg`,
            ` ${vehicle.bruto && vehicle.tar ? (vehicle.bruto - vehicle.tar).toLocaleString() : "-"} Kg`,
            ` ${vehicle.discount !== undefined ? vehicle.discount : "0"} %`,
            `Rp ${vehicle.pricePerKg.toLocaleString()}`,
            `${vehicle.nettobersih?.toLocaleString() || "0"} Kg`,
            `Rp ${vehicle.totalPrice?.toLocaleString() || "0"}`,
            vehicle.operator
        ]);
    
        // Tambahkan baris total
        tableBody.push([
            "", // Tanggal
            "TOTAL", // No Polisi
            "", // Brutto
            "", // Tar
            `${totalNettoKotor.toLocaleString()} Kg`, // Netto Kotor
            "", // Potongan
            "", // Harga/kg
            `${totalNettoBersih.toLocaleString()} Kg`, // Netto Bersih
            `Rp ${totalHarga.toLocaleString()}`, // Total Harga
            "", // Lokasi
        ]);
    
        doc.text("Laporan Timbangan Sawit", 14, 10);
        autoTable(doc, {
            head: [["Tanggal", "No Polisi", "Brutto", "Tar", "Netto", "Potongan", "Harga/Kg", "Netto Bersih", "Total", "Lokasi"]],
            body: tableBody,
            startY: 15,
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
            },
            didDrawCell: data => {
                if (data.row.index === tableBody.length - 1) {
                    // Bold untuk baris total
                    doc.setFont("helvetica", "bold");
                }
            }
        });
    
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.text(`Page ${i} of ${totalPages}`, 180, 290);
        }
    
        doc.save("Laporan_Timbangan_Sawit.pdf");
    };
    
    const downloadBackup = () => {
        // Prepare data for main sheet
        const excelData = vehicles.map(vehicle => {
            const netto = vehicle.bruto && vehicle.tar ? vehicle.bruto - vehicle.tar : 0;
            const potongannetto = (netto * (vehicle.discount || 0)) / 100;
            const nettobersih = Math.round(netto - potongannetto);

            return {
                'Tanggal': vehicle.date ? new Date(vehicle.date).toLocaleString("id-ID") : "-",
                'No Polisi': vehicle.plateNumber,
                'Brutto': `${vehicle.bruto?.toLocaleString() || "-"} Kg`,
                'Tar': `${vehicle.tar?.toLocaleString() || "-"} Kg`,
                'Netto': `${netto.toLocaleString()} Kg`,
                'Potongan': `${vehicle.discount !== undefined ? vehicle.discount : "0"} %`,
                'Harga/kg': `Rp ${vehicle.pricePerKg.toLocaleString()}`,
                'Netto Bersih': `${nettobersih.toLocaleString()} Kg`,
                'Total': `Rp ${vehicle.totalPrice?.toLocaleString() || "0"}`,
                'Lokasi': vehicle.operator
            };
        });

        // Create workbook
        const wb = XLSX.utils.book_new();

        // Add main data sheet
        const ws = XLSX.utils.json_to_sheet(excelData);
        XLSX.utils.book_append_sheet(wb, ws, "Data Kendaraan");

        // Add summary sheet
        const summaryData = [
            { 'Metric': 'Total Netto Kotor', 'Value': totalNetto.toLocaleString(), 'Unit': 'Kg' },
            { 'Metric': 'Total Netto Bersih', 'Value': totalNettoBersih.toLocaleString(), 'Unit': 'Kg' },
            { 'Metric': 'Total Harga', 'Value': totalHarga.toLocaleString(), 'Unit': 'Rp' }
        ];
        const wsSummary = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

        // Add operator summary sheet
        const operatorData = Object.entries(rekapPerOperator).map(([operator, data]) => ({
            'Operator': operator,
            'Netto': `${data.netto.toLocaleString()} Kg`,
            'Netto Bersih': `${data.nettoBersih.toLocaleString()} Kg`,
            'Total': `Rp ${data.total.toLocaleString()}`
        }));
        const wsOperator = XLSX.utils.json_to_sheet(operatorData);
        XLSX.utils.book_append_sheet(wb, wsOperator, "Rekap Operator");

        // Add metadata sheet
        const metadata = [
            { 'Property': 'Backup Date', 'Value': new Date().toLocaleString("id-ID") },
            { 'Property': 'Total Records', 'Value': vehicles.length },
            { 'Property': 'Search Term', 'Value': search || 'None' },
            { 'Property': 'Selected Operator', 'Value': selectedOperator || 'All' }
        ];
        const wsMetadata = XLSX.utils.json_to_sheet(metadata);
        XLSX.utils.book_append_sheet(wb, wsMetadata, "Metadata");

        // Save Excel file with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        XLSX.writeFile(wb, `backup_admin_${timestamp}.xlsx`);
    };
    
    return (
        <div className="container-fluid mt-4">
            <div className="row mb-4">
                <div className="col-12">
                    <h2 className="text-center mb-4">Monitor Timbangan Sawit</h2>
                </div>
            </div>

            {/* Timbangan Cards Section */}
            <div className="row mb-4">
                {Object.entries(loadCells).map(([key, value]) => {
                    const keyToLocation = {
                        sigalaGala: "Sigalagala",
                        hapung: "Hapung",
                        paranjulu: "Paranjulu",
                        binanga: "Binanga",
                        portibi: "Portibi",
                    };
                    
                    const location = keyToLocation[key];
                    const harga = prices[location] || 0;
                    const rekap = rekapPerOperator[location] || {
                        netto: 0,
                        nettoBersih: 0,
                        total: 0
                    };
                    const status = getStatusInfo(key);

                    // For other locations
                    return (
                        <div className="col-md-6 col-lg-4 mb-3" key={key}>
                            <div className="card timbangan-card h-100">
                                <div className="card-header bg-dark text-white">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h4 className="mb-0">Timbangan {location}</h4>
                                        <span className={`badge bg-${status.color}`}>
                                            {status.icon}
                                        </span>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="row mb-3">
                                        <div className="col-12">
                                            <div className={`alert alert-${status.color} py-1 mb-2`} role="alert">
                                                <small>{status.message}</small>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <h6 className="text-muted">Realtime</h6>
                                            <h4 className="text-primary">{value.toLocaleString()} kg</h4>
                                        </div>
                                        <div className="col-6">
                                            <h6 className="text-muted">Harga/kg</h6>
                                            <h4 className="text-success">Rp {harga.toLocaleString()}</h4>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-6">
                                            <h6 className="text-muted">Netto Kotor</h6>
                                            <h5>{rekap.netto.toLocaleString()} Kg</h5>
                                        </div>
                                        <div className="col-6">
                                            <h6 className="text-muted">Netto Bersih</h6>
                                            <h5>{rekap.nettoBersih.toLocaleString()} Kg</h5>
                                        </div>
                                    </div>
                                    <div className="row mt-3">
                                        <div className="col-12">
                                            <h6 className="text-muted">Total Bayar</h6>
                                            <h4 className="text-danger">Rp {rekap.total.toLocaleString()}</h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Summary Card - Placed after Binanga and before Portibi */}
                <div className="col-md-6 col-lg-4 mb-3">
                    <div className="card h-100 border-3 border-dark">
                        <div className="card-header bg-dark text-white">
                            <h4 className="mb-0 fw-bold">TOTAL KESELURUHAN</h4>
                        </div>
                        <div className="card-body">
                            <div className="row mb-3">
                                <div className="col-12">
                                    <h6 className="text-muted fw-bold">Total Netto Kotor</h6>
                                    <h3 className="text-primary fw-bold">{totalNetto.toLocaleString()} Kg</h3>
                                </div>
                            </div>
                            <div className="row mb-3">
                                <div className="col-12">
                                    <h6 className="text-muted fw-bold">Total Netto Bersih</h6>
                                    <h3 className="text-success fw-bold">{totalNettoBersih.toLocaleString()} Kg</h3>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-12">
                                    <h6 className="text-muted fw-bold">Total Harga</h6>
                                    <h3 className="text-danger fw-bold">Rp {totalHarga.toLocaleString()}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filter Section */}
            <div className="row mb-4">
                <div className="col-md-8">
                    <div className="input-group">
                        <span className="input-group-text">
                            <i className="bi bi-search"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Cari Nomor Kendaraan"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-md-4">
                    <select
                        className="form-select"
                        value={selectedOperator}
                        onChange={(e) => setSelectedOperator(e.target.value)}
                    >
                        <option value="">Semua Operator</option>
                        {uniqueOperators.map((operator, index) => (
                            <option key={index} value={operator}>{operator}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex gap-3">
                        <button 
                            className="btn btn-primary rounded-pill px-4" 
                            onClick={downloadPDF}
                        >
                            <i className="bi bi-download me-2"></i>Download PDF
                        </button>
                        <button 
                            className="btn btn-success rounded-pill px-4" 
                            onClick={downloadBackup}
                        >
                            <FaFileExcel className="me-2" />
                            Backup Excel
                        </button>
                        <button 
                            className="btn btn-danger rounded-pill px-4" 
                            onClick={handleClearAll}
                        >
                            <i className="bi bi-trash me-2"></i>Hapus Semua Data
                        </button>
                    </div>
                </div>
            </div>

            {/* Vehicle Table */}
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header bg-dark text-white">
                            <h4 className="mb-0">Kendaraan Terdaftar</h4>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead className="table-dark">
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
                                            <th>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vehicles
                                            .filter(vehicle => 
                                                (selectedOperator === "" || vehicle.operator === selectedOperator)
                                            )
                                            .filter(vehicle => vehicle.plateNumber.includes(search.toUpperCase()))
                                            .map((vehicle, index) => {
                                                const isEditing = editingVehicle && editingVehicle._id === vehicle._id;
                                                const potongannetto = (vehicle.netto * vehicle.discount) / 100;
                                                const nettobersih = Math.round(vehicle.netto - potongannetto);
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
                                                                    className="form-control form-control-sm"
                                                                />
                                                            ) : vehicle.plateNumber}
                                                        </td>
                                                        <td>
                                                            {isEditing ? (
                                                                <input 
                                                                    type="number"
                                                                    value={editingVehicle.bruto}
                                                                    onChange={(e) => setEditingVehicle({ ...editingVehicle, bruto: e.target.value })}
                                                                    className="form-control form-control-sm"
                                                                />
                                                            ) : `${vehicle.bruto || "-"} Kg`}
                                                        </td>
                                                        <td>
                                                            {isEditing ? (
                                                                <input 
                                                                    type="number"
                                                                    value={editingVehicle.tar}
                                                                    onChange={(e) => setEditingVehicle({ ...editingVehicle, tar: e.target.value })}
                                                                    className="form-control form-control-sm"
                                                                />
                                                            ) : `${vehicle.tar || "-"} Kg`}
                                                        </td>
                                                        <td>
                                                            {isEditing ? (
                                                                <input 
                                                                    type="number"
                                                                    value={editingVehicle.netto}
                                                                    onChange={(e) => setEditingVehicle({ ...editingVehicle, netto: e.target.value })}
                                                                    className="form-control form-control-sm"
                                                                />
                                                            ) : `${vehicle.bruto && vehicle.tar ? (vehicle.bruto - vehicle.tar) : "-"} Kg`}
                                                        </td>
                                                        <td>
                                                            {isEditing ? (
                                                                <input 
                                                                    type="number"
                                                                    value={editingVehicle.discount}
                                                                    onChange={(e) => setEditingVehicle({ ...editingVehicle, discount: e.target.value })}
                                                                    className="form-control form-control-sm"
                                                                />
                                                            ) : `${vehicle.discount !== undefined ? vehicle.discount : "0"}%`}
                                                        </td>
                                                        <td>
                                                            {isEditing ? (
                                                                <input 
                                                                    type="number"
                                                                    value={editingVehicle.pricePerKg}
                                                                    onChange={(e) => setEditingVehicle({ ...editingVehicle, pricePerKg: e.target.value })}
                                                                    className="form-control form-control-sm"
                                                                />
                                                            ) : `Rp ${vehicle.pricePerKg.toLocaleString()}`}
                                                        </td>
                                                        <td>
                                                            {isEditing ? (
                                                                <input 
                                                                    type="number"
                                                                    value={editingVehicle.nettobersih}
                                                                    onChange={(e) => setEditingVehicle({ ...editingVehicle, nettobersih: e.target.value })}
                                                                    className="form-control form-control-sm"
                                                                />
                                                            ) : `${nettobersih.toLocaleString() || "-"} Kg`}
                                                        </td>
                                                        <td>
                                                            {isEditing ? (
                                                                <input 
                                                                    type="number"
                                                                    value={editingVehicle.totalPrice}
                                                                    onChange={(e) => setEditingVehicle({ ...editingVehicle, totalPrice: e.target.value })}
                                                                    className="form-control form-control-sm"
                                                                />
                                                            ) : `Rp ${vehicle.totalPrice.toLocaleString()}`}
                                                        </td>
                                                        <td>{vehicle.operator}</td>
                                                        <td>
                                                            {isEditing ? (
                                                                <div className="d-flex gap-2">
                                                                    <button 
                                                                        className="btn btn-success btn-sm rounded-pill px-3" 
                                                                        onClick={() => handleUpdate(vehicle._id)}
                                                                        title="Simpan"
                                                                    >
                                                                        <i className="bi bi-check-lg"></i>
                                                                    </button>
                                                                    <button 
                                                                        className="btn btn-secondary btn-sm rounded-pill px-3" 
                                                                        onClick={() => setEditingVehicle(null)}
                                                                        title="Batal"
                                                                    >
                                                                        <i className="bi bi-x-lg"></i>
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="d-flex gap-2">
                                                                    <button 
                                                                        className="btn btn-warning btn-sm rounded-pill px-3" 
                                                                        onClick={() => handleEdit(vehicle)}
                                                                        title="Edit"
                                                                    >
                                                                        <i className="bi bi-pencil-fill"></i>
                                                                    </button>
                                                                    <button 
                                                                        className="btn btn-danger btn-sm rounded-pill px-3" 
                                                                        onClick={() => handleDelete(vehicle._id)}
                                                                        title="Hapus"
                                                                    >
                                                                        <i className="bi bi-trash-fill"></i>
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
