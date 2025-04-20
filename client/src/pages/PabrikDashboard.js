import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { FaSearch, FaSort, FaSortUp, FaSortDown, FaSave, FaTrash, FaEdit, FaFileExcel, FaSignOutAlt, FaPrint } from "react-icons/fa";
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL;

const DashboardInputPS = () => {
    const navigate = useNavigate();
    const [docReference, setDocReference] = useState("");
    const [vehicleId, setVehicleId] = useState("");
    const [fruitType, setFruitType] = useState("");
    const [weightIn, setWeightIn] = useState("");
    const [weightOut, setWeightOut] = useState("");
    const [netGross, setNetGross] = useState("");
    const [penalty, setPenalty] = useState("");
    const [netWeight, setNetWeight] = useState("");
    const [rejectedBunches, setRejectedBunches] = useState("");
    const [looseWeight, setLooseWeight] = useState("");
    const [rejectedWeight, setRejectedWeight] = useState("");
    const [komidel, setKomidel] = useState("");
    const [total, setTotal] = useState("");
    const [entries, setEntries] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [price, setPrice] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [todayTotals, setTodayTotals] = useState({
        totalNetGross: 0,
        totalNetWeight: 0,
        totalRejectedWeight: 0,
        totalAmount: 0
    });

    useEffect(() => {
        axios.get(`${API_URL}/api/sp`)
            .then((res) => setEntries(res.data))
            .catch((err) => console.error("Error fetching data:", err));
    }, []);

    // Calculate dependent values
    useEffect(() => {
        const weightInNum = Number(weightIn);
        const weightOutNum = Number(weightOut);
        const netGrossCalc = weightInNum && weightOutNum ? weightInNum - weightOutNum : 0;
        setNetGross(netGrossCalc);

        const netWeightCalc = netGrossCalc - Number(penalty || 0);
        setNetWeight(netWeightCalc);

        // Calculate total with fixed 0.25% PPH
        const pphCalc = (netWeightCalc * Number(price || 0)) * 0.0025; // 0.25%
        const totalCalc = (netWeightCalc * Number(price || 0)) - 
                         (Number(rejectedWeight || 0) * 8) - 
                         (netGrossCalc * 16) - 
                         pphCalc;
        setTotal(totalCalc);
    }, [weightIn, weightOut, penalty, price, rejectedWeight]);

    useEffect(() => {
        const fetchTodayTotals = async () => {
            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                const response = await axios.get(`${API_URL}/api/sp/date-range/${today.toISOString()}/${tomorrow.toISOString()}`);
                const todayEntries = response.data;

                const totals = todayEntries.reduce((acc, entry) => ({
                    totalNetGross: acc.totalNetGross + (entry.netGross || 0),
                    totalNetWeight: acc.totalNetWeight + (entry.netWeight || 0),
                    totalRejectedWeight: acc.totalRejectedWeight + (entry.rejectedWeight || 0),
                    totalAmount: acc.totalAmount + (entry.total || 0)
                }), {
                    totalNetGross: 0,
                    totalNetWeight: 0,
                    totalRejectedWeight: 0,
                    totalAmount: 0
                });

                setTodayTotals(totals);
            } catch (err) {
                console.error("Error fetching today's totals:", err);
            }
        };

        fetchTodayTotals();
    }, [entries]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = "/";
    };    

    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const sortedData = React.useMemo(() => {
        let sortableData = [...entries];
        if (sortConfig.key) {
            sortableData.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === "asc" ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === "asc" ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableData;
    }, [entries, sortConfig]);

    const filteredData = React.useMemo(() => {
        return sortedData.filter((item) => {
            return (
                item.docReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.vehicleId?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        });
    }, [sortedData, searchTerm]);

    const handleEdit = (id) => {
        const entryToEdit = entries.find(entry => entry._id === id);
        if (entryToEdit) {
            setEditingId(id);
            setDocReference(entryToEdit.docReference || "");
            setVehicleId(entryToEdit.vehicleId || "");
            setFruitType(entryToEdit.fruitType || "");
            setWeightIn(entryToEdit.weightIn || "");
            setWeightOut(entryToEdit.weightOut || "");
            setPenalty(entryToEdit.penalty || "");
            setRejectedBunches(entryToEdit.rejectedBunches || "");
            setLooseWeight(entryToEdit.looseWeight || "");
            setRejectedWeight(entryToEdit.rejectedWeight || "");
            setKomidel(entryToEdit.komidel || "");
            setPrice(entryToEdit.price || "");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus data ini?")) {
            try {
                await axios.delete(`${API_URL}/api/sp/${id}`);
                setSuccess("Data berhasil dihapus!");
                
                // Refresh data
                const response = await axios.get(`${API_URL}/api/sp`);
                setEntries(response.data);
            } catch (err) {
                console.error("Error deleting data:", err);
                setError("Terjadi kesalahan saat menghapus data: " + (err.response?.data?.message || err.message));
            }
        }
    };

    const handleSubmit = async () => {
        setError(null);
        setSuccess(null);

        if (!docReference || !vehicleId || !fruitType || !weightIn || !weightOut || !komidel) {
            setError("Semua field wajib diisi!");
            return;
        }

        try {
            const payload = {
                docReference,
                vehicleId,
                fruitType,
                weightIn: Number(weightIn),
                weightOut: Number(weightOut),
                looseWeight: Number(looseWeight || 0),
                penalty: Number(penalty || 0),
                komidel: Number(komidel),
                price: Number(price || 0),
                fruitType,
                rejectedBunches: Number(rejectedBunches || 0),
                rejectedWeight: Number(rejectedWeight || 0)
            };

            let response;
            if (editingId) {
                response = await axios.put(`${API_URL}/api/sp/${editingId}`, payload);
                setSuccess("Data berhasil diperbarui!");
            } else {
                response = await axios.post(`${API_URL}/api/sp`, payload);
                setSuccess("Data berhasil disimpan!");
            }
            
            // Reset all fields
            setEditingId(null);
            setDocReference(""); 
            setVehicleId(""); 
            setFruitType(""); 
            setWeightIn(""); 
            setWeightOut("");
            setPenalty(""); 
            setRejectedBunches(""); 
            setLooseWeight(""); 
            setRejectedWeight("");
            setKomidel(""); 
            setNetGross(""); 
            setNetWeight("");
            setPrice("");
            
            // Refresh data
            const updatedEntries = await axios.get(`${API_URL}/api/sp`);
            setEntries(updatedEntries.data);
        } catch (err) {
            console.error("Error saving data:", err);
            setError("Terjadi kesalahan saat menyimpan data: " + (err.response?.data?.message || err.message));
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const downloadExcel = () => {
        // Prepare data
        const excelData = filteredData.map(item => ({
            Tanggal: format(parseISO(item.date), "dd MMM yyyy HH:mm", { locale: id }),
            'Doc Reference': item.docReference,
            'Vehicle ID': item.vehicleId,
            'Weight In (Kg)': item.weightIn || 0,
            'Weight Out (Kg)': item.weightOut || 0,
            'Net Gross (Kg)': item.netGross || 0,
            'UB (Rp)': (item.netGross || 0) * 16,
            'Loose Weight (Kg)': item.looseWeight || 0,
            'Penalty (Kg)': item.penalty || 0,
            'Net Weight (Kg)': item.netWeight || 0,
            'Price (Rp)': item.price || 0,
            'Net_Price (Rp)': (item.netWeight || 0) * (item.price || 0),
            'PPH (0.25%)': (item.netWeight || 0) * (item.price || 0) * 0.0025,
            'Komidel (Kg/Tdn)': item.komidel || 0,
            'Jenis Buah': item.fruitType,
            'Rejected Weight (Kg)': item.rejectedWeight || 0,
            'UM (Rp)': (item.rejectedWeight || 0) * 8,
           
            'Total (Rp)': (item.netWeight || 0) * (item.price || 0) - 
                          (item.rejectedWeight || 0) * 8 - 
                          (item.netGross || 0) * 16 - 
                          ((item.netWeight || 0) * (item.price || 0)) * 0.0025
        }));

        // Create workbook
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Surat Pengantar");
        
        // Save Excel file with current date
        const today = new Date();
        const dateString = format(today, "yyyyMMdd");
        XLSX.writeFile(wb, `surat-pengantar-${dateString}.xlsx`);
    };

    const handlePrint = async (item) => {
        try {
            // Validate required fields with defaults
            const printData = {
                date: item.date || new Date().toISOString(),
                docReference: item.docReference || "-",
                vehicleId: item.vehicleId || "-",
                weightIn: item.weightIn || 0,
                weightOut: item.weightOut || 0,
                netGross: item.netGross || 0,
                looseWeight: item.looseWeight || 0,
                komidel: item.komidel || 0,
                penalty: item.penalty || 0,
                netWeight: item.netWeight || 0,
                price: item.price || 0,
                rejectedWeight: item.rejectedWeight || 0,
                fruitType: item.fruitType || "-",
            };

            // Calculate Final Price
            const finalPrice = (printData.netWeight * printData.price) - 
                              (printData.rejectedWeight * 8) - 
                              (printData.netGross * 16) - 
                              ((printData.netWeight * printData.price) * 0.0025);

            // Generate Invoice Text for preview
            const previewText = 
                `Tanggal          : ${printData.date ? format(parseISO(printData.date), "dd MMM yyyy HH:mm", { locale: id }) : '-'}\n` +
                `Doc Reference    : ${printData.docReference}\n` +
                `Vehicle ID       : ${printData.vehicleId}\n` +
                `Weight In        : ${printData.weightIn.toLocaleString()} Kg\n` +
                `Weight Out       : ${printData.weightOut.toLocaleString()} Kg\n` +
                `Net Gross        : ${printData.netGross.toLocaleString()} Kg\n` +
                `Loose Weight     : ${printData.looseWeight.toLocaleString()} Kg\n` +
                `Komidel          : ${printData.komidel.toLocaleString()} Kg/Tdn\n` +
                `Penalty          : ${printData.penalty.toLocaleString()} Kg\n` +
                `Net Weight       : ${printData.netWeight.toLocaleString()} Kg\n` +
                `Price/Kg         : Rp ${printData.price.toLocaleString()}\n` +
                `PPH (0.25%)      : Rp ${((printData.netWeight * printData.price) * 0.0025).toLocaleString()}\n` +
                `Rejected Weight  : ${printData.rejectedWeight.toLocaleString()} Kg\n` +
                `Jenis Buah       : ${printData.fruitType}\n` +
                `Total            : Rp ${finalPrice.toLocaleString()}`;

            // Show preview popup
            const shouldPrint = window.confirm(
                "Preview Nota:\n\n" + previewText + "\n\nKlik OK untuk mencetak."
            );

            if (!shouldPrint) {
                return; // User cancelled
            }

            // Proceed with printing
            console.log("Printing data:", printData);

            // 1. Request Bluetooth Device
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ["000018f0-0000-1000-8000-00805f9b34fb"],
            });

            // 2. Connect to Device
            const server = await device.gatt.connect();
            const service = await server.getPrimaryService("000018f0-0000-1000-8000-00805f9b34fb");
            const characteristic = await service.getCharacteristic("00002af1-0000-1000-8000-00805f9b34fb");

            // 3. Generate ESC/POS formatted invoice text
            const ESC = "\x1B";
            const CENTER = ESC + "\x61\x01";
            const LEFT = ESC + "\x61\x00";
            const BOLD_ON = ESC + "\x45\x01";
            const BOLD_OFF = ESC + "\x45\x00";
            const FONT_DOUBLE = ESC + "\x21\x21";
            const FONT_NORMAL = ESC + "\x21\x21";
            const LINE_FEED = "\n";
            const SEPARATOR = "================================\n";

            const invoiceText =
                LINE_FEED +
                CENTER + FONT_DOUBLE + "Slip Pembayaran SP\n" + FONT_NORMAL +
                CENTER + BOLD_ON + " * Bintang Sawit Makmur *\n" + BOLD_OFF +
                SEPARATOR +
                LEFT +
                `Tanggal          : ${printData.date ? format(parseISO(printData.date), "dd MMM yyyy HH:mm", { locale: id }) : '-'}\n` +
                `Doc Reference    : ${printData.docReference}\n` +
                `Vehicle ID       : ${printData.vehicleId}\n` +
                `Weight In        : ${printData.weightIn.toLocaleString()} Kg\n` +
                `Weight Out       : ${printData.weightOut.toLocaleString()} Kg\n` +
                `Net Gross        : ${printData.netGross.toLocaleString()} Kg\n` +
                `Loose Weight     : ${printData.looseWeight.toLocaleString()} Kg\n` +
                `Komidel          : ${printData.komidel.toLocaleString()} Kg/Tdn\n` +
                `Penalty          : ${printData.penalty.toLocaleString()} Kg\n` +
                `Net Weight       : ${printData.netWeight.toLocaleString()} Kg\n` +
                `Price/Kg         : Rp ${printData.price.toLocaleString()}\n` +
                `PPH (0.25%)      : Rp ${((printData.netWeight * printData.price) * 0.0025).toLocaleString()}\n` +
                `Rejected Weight  : ${printData.rejectedWeight.toLocaleString()} Kg\n` +
                `Jenis Buah       : ${printData.fruitType}\n` +
                FONT_DOUBLE + `Total           : Rp ${finalPrice.toLocaleString()}\n` + FONT_NORMAL +
                SEPARATOR +
                CENTER + "Terima Kasih!\n" +
                LINE_FEED.repeat(3);

            // 4. Send to Printer
            const encoder = new TextEncoder();
            const data = encoder.encode(invoiceText);
            await characteristic.writeValue(data);

            alert("Nota berhasil dikirim ke printer ✅");
        } catch (error) {
            console.error("Gagal mencetak:", error);
            alert(`Gagal mengirim nota ke printer ❌\nError: ${error.message}`);
        }
    };

    return (
        <div className="container-fluid p-4">
            <div className="row mb-4">
                <div className="col-12">
                    <div className="row">
                        <div className="col-md-3 mb-4">
                            <div className="card border-0 shadow-sm">
                                <div className="card-body">
                                    <h6 className="card-title text-muted mb-2">Total Net Gross</h6>
                                    <h3 className="mb-0">{todayTotals.totalNetGross.toLocaleString()} Kg</h3>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3 mb-4">
                            <div className="card border-0 shadow-sm">
                                <div className="card-body">
                                    <h6 className="card-title text-muted mb-2">Total Net Weight</h6>
                                    <h3 className="mb-0">{todayTotals.totalNetWeight.toLocaleString()} Kg</h3>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3 mb-4">
                            <div className="card border-0 shadow-sm">
                                <div className="card-body">
                                    <h6 className="card-title text-muted mb-2">Total Rejected Weight</h6>
                                    <h3 className="mb-0">{todayTotals.totalRejectedWeight.toLocaleString()} Kg</h3>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3 mb-4">
                            <div className="card border-0 shadow-sm">
                                <div className="card-body">
                                    <h6 className="card-title text-muted mb-2">Total Amount</h6>
                                    <h3 className="mb-0">{formatCurrency(todayTotals.totalAmount)}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-4">
                            <h5 className="card-title mb-4 text-primary">Input Data Surat Pengantar</h5>
                            
                            {error && (
                                <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
                                    {error}
                                    <button type="button" className="btn-close" onClick={() => setError(null)}></button>
                                </div>
                            )}
                            
                            {success && (
                                <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
                                    {success}
                                    <button type="button" className="btn-close" onClick={() => setSuccess(null)}></button>
                                </div>
                            )}

                            <div className="row g-4">
                                <div className="col-md-4">
                                    <div className="form-group mb-3">
                                        <label className="form-label">Doc Reference</label>
                                        <input 
                                            className="form-control" 
                                            value={docReference} 
                                            onChange={(e) => setDocReference(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group mb-3">
                                        <label className="form-label">Vehicle ID</label>
                                        <input 
                                            className="form-control" 
                                            value={vehicleId} 
                                            onChange={(e) => setVehicleId(e.target.value.toUpperCase())}
                                            required
                                        />
                                    </div>
                                    <div className="form-group mb-3">
                                        <label className="form-label">Weight In (Kg)</label>
                                        <input 
                                            type="number" 
                                            className="form-control" 
                                            value={weightIn} 
                                            onChange={(e) => setWeightIn(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group mb-3">
                                        <label className="form-label">Weight Out (Kg)</label>
                                        <input 
                                            type="number" 
                                            className="form-control" 
                                            value={weightOut} 
                                            onChange={(e) => setWeightOut(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group mb-3">
                                        <label className="form-label">Net Gross (Kg)</label>
                                        <input 
                                            type="number" 
                                            className="form-control bg-light" 
                                            value={netGross}
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-group mb-3">
                                        <label className="form-label">Loose Weight (Kg)</label>
                                        <input 
                                            type="number" 
                                            className="form-control" 
                                            value={looseWeight} 
                                            onChange={(e) => setLooseWeight(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group mb-3">
                                        <label className="form-label">Penalty (Kg)</label>
                                        <input 
                                            type="number" 
                                            className="form-control" 
                                            value={penalty} 
                                            onChange={(e) => setPenalty(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group mb-3">
                                        <label className="form-label">Komidel (Kg/Tdn)</label>
                                        <input 
                                            type="number" 
                                            className="form-control" 
                                            value={komidel} 
                                            onChange={(e) => setKomidel(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group mb-3">
                                        <label className="form-label">Rejected Weight (Kg)</label>
                                        <input 
                                            type="number" 
                                            className="form-control" 
                                            value={rejectedWeight} 
                                            onChange={(e) => setRejectedWeight(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group mb-3">
                                        <label className="form-label">Net Weight (Kg)</label>
                                        <input 
                                            type="number" 
                                            className="form-control bg-light" 
                                            value={netWeight}
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-group mb-3">
                                        <label className="form-label">Rejected Bunches (Tdn)</label>
                                        <input 
                                            type="number" 
                                            className="form-control" 
                                            value={rejectedBunches} 
                                            onChange={(e) => setRejectedBunches(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group mb-3">
                                        <label className="form-label">Price (Rp)</label>
                                        <input 
                                            type="number" 
                                            className="form-control" 
                                            value={price} 
                                            onChange={(e) => setPrice(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group mb-3">
                                        <label className="form-label">PPH (0.25%)</label>
                                        <input 
                                            type="text" 
                                            className="form-control bg-light" 
                                            value={formatCurrency((netWeight * Number(price || 0)) * 0.0025)}
                                            disabled
                                        />
                                    </div>
                                    
                                    <div className="form-group mb-3">
                                        <label className="form-label">Jenis Buah</label>
                                        <select 
                                            className="form-control" 
                                            value={fruitType} 
                                            onChange={(e) => setFruitType(e.target.value)}
                                            required
                                        >
                                            <option value="">Pilih Jenis Buah</option>
                                            <option value="Buah Super">Buah Super</option>
                                            <option value="Buah Besar">Buah Besar</option>
                                            <option value="Buah Kecil">Buah Kecil</option>
                                        </select>
                                    </div>
                                    
                                </div>
                                <div className="col-12">
                                    <div className="card bg-light mb-3">
                                        <div className="card-body">
                                            <div className="row align-items-center">
                                                <div className="col">
                                                    <h5 className="mb-0">Total Amount</h5>
                                                    <small className="text-muted d-block">
                                                        <div className="mt-2">
                                                            <h5 className="d-flex flex-wrap gap-2 mb-3">
                                                                <span className="text-primary me-2">Net_Price: {formatCurrency((netWeight * Number(price || 0)))}</span>
                                                                <span className="text-danger me-2">PPH: {formatCurrency((netWeight * Number(price || 0)) * 0.0025)}</span>
                                                                <span className="text-danger me-2">UB: {formatCurrency(Number(netGross || 0) * 16)}</span>
                                                                <span className="text-danger">UM: {formatCurrency(Number(rejectedWeight || 0) * 8)}</span>
                                                            </h5>
                                                        </div>
                                                    </small>
                                                </div> 
                                                <div className="col-auto">
                                                    <h4 className="mb-0 text-primary">{formatCurrency(total)}</h4>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        className="btn btn-primary px-4 py-2" 
                                        onClick={handleSubmit}
                                    >
                                        <FaSave className="me-2" />
                                        {editingId ? "Update Data" : "Simpan Data"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div className="d-flex align-items-center">
                                    <h5 className="card-title text-primary mb-0 me-4">Data SP</h5>
                                    <div className="btn-group">
                                        <button 
                                            className="btn btn-outline-success btn-sm"
                                            onClick={downloadExcel}
                                            title="Download Excel"
                                        >
                                            <FaFileExcel className="me-2" />
                                            Excel
                                        </button>
                                        <button 
                                            className="btn btn-outline-danger btn-sm  ms-3 "
                                            onClick={handleLogout}
                                            title="Logout"
                                        >
                                            <FaSignOutAlt className="me-2" />
                                            Logout
                                        </button>
                                    </div>
                                </div>
                                <div className="input-group" style={{ width: '300px' }}>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Cari..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <button className="btn btn-outline-secondary" type="button">
                                        <FaSearch />
                                    </button>
                                </div>
                            </div>

                            <div className="table-responsive" style={{ overflowX: "auto" }}>
                                <table className="table table-hover align-middle" style={{ minWidth: "1000px" }}>
                                    <thead>
                                        <tr className="table-light">
                                            <th 
                                                onClick={() => handleSort("date")} 
                                                style={{ cursor: "pointer", minWidth: "150px" }}
                                                className="text-nowrap"
                                            >
                                                Tanggal
                                                {sortConfig.key === "date" && (
                                                    sortConfig.direction === "asc" ? <FaSortUp className="ms-1" /> : <FaSortDown className="ms-1" />
                                                )}
                                                {sortConfig.key !== "date" && <FaSort className="ms-1" />}
                                            </th>
                                            <th 
                                                onClick={() => handleSort("docReference")} 
                                                style={{ cursor: "pointer", minWidth: "120px" }}
                                                className="text-nowrap"
                                            >
                                                Doc Reference
                                                {sortConfig.key === "docReference" && (
                                                    sortConfig.direction === "asc" ? <FaSortUp className="ms-1" /> : <FaSortDown className="ms-1" />
                                                )}
                                                {sortConfig.key !== "docReference" && <FaSort className="ms-1" />}
                                            </th>
                                            <th 
                                                onClick={() => handleSort("vehicleId")} 
                                                style={{ cursor: "pointer", minWidth: "100px" }}
                                                className="text-nowrap"
                                            >
                                                Vehicle ID
                                                {sortConfig.key === "vehicleId" && (
                                                    sortConfig.direction === "asc" ? <FaSortUp className="ms-1" /> : <FaSortDown className="ms-1" />
                                                )}
                                                {sortConfig.key !== "vehicleId" && <FaSort className="ms-1" />}
                                            </th>
                                            <th className="text-end">Weight In)</th>
                                            <th className="text-end">Weight Out</th>
                                            <th className="text-end">Net Gross</th>
                                            <th className="text-end">Loose Weight</th>
                                            <th className="text-end">Komidel</th>
                                            <th className="text-end">Penalty</th>
                                            <th className="text-end">Net Weight</th>
                                            <th className="text-end">Price</th>
                                            <th className="text-end">(0.25%)</th>
                                            <th className="text-end">Rejected Weight</th>
                                            <th 
                                                onClick={() => handleSort("fruitType")} 
                                                style={{ cursor: "pointer", minWidth: "120px" }}
                                                className="text-nowrap"
                                            >
                                                Jenis Buah
                                                {sortConfig.key === "fruitType" && (
                                                    sortConfig.direction === "asc" ? <FaSortUp className="ms-1" /> : <FaSortDown className="ms-1" />
                                                )}
                                                {sortConfig.key !== "fruitType" && <FaSort className="ms-1" />}
                                            </th>
                                           
                                            <th className="text-end">Total (Rp)</th>
                                            <th className="text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredData.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="text-nowrap">
                                                    {item.date ? format(parseISO(item.date), "dd MMM yyyy HH:mm", { locale: id }) : '-'}
                                                </td>
                                                <td>{item.docReference || '-'}</td>
                                                <td>{item.vehicleId || '-'}</td>
                                                <td className="text-end">{(item.weightIn || 0).toLocaleString()} Kg</td>
                                                <td className="text-end">{(item.weightOut || 0).toLocaleString()} Kg</td>
                                                <td className="text-end">{(item.netGross || 0).toLocaleString()} Kg</td>
                                                <td className="text-end">{(item.looseWeight || 0).toLocaleString()} Kg</td>
                                                <td className="text-end">{(item.komidel || 0).toLocaleString()} Kg/Tdn</td>
                                                <td className="text-end">{(item.penalty || 0).toLocaleString()} Kg</td>
                                                <td className="text-end">{(item.netWeight || 0).toLocaleString()} Kg</td>
                                                <td className="text-end">{formatCurrency(item.price || 0)}</td>
                                                <td className="text-end">
                                                    {formatCurrency((item.netWeight || 0) * (item.price || 0) * 0.0025)}
                                                </td>
                                                <td className="text-end">{(item.rejectedWeight || 0).toLocaleString()} Kg</td>
                                                <td>{item.fruitType || '-'}</td>
                                                <td className="text-end fw-bold">
                                                    {formatCurrency(
                                                        (item.netWeight || 0) * (item.price || 0) - 
                                                        (item.rejectedWeight || 0) * 8 - 
                                                        (item.netGross || 0) * 16 - 
                                                        ((item.netWeight || 0) * (item.price || 0)) * 0.0025
                                                    )}
                                                </td>
                                                <td className="text-center">
                                                    <div className="btn-group">
                                                        <button 
                                                            className="btn btn-sm btn-success me-2"
                                                            onClick={() => handlePrint(item)}
                                                            style={{ padding: "0.5rem 1rem" }}
                                                        >
                                                            <FaPrint className="me-1" /> Print
                                                        </button>
                                                        <button 
                                                            className="btn btn-sm btn-outline-primary me-2"
                                                            onClick={() => handleEdit(item._id)}
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button 
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => handleDelete(item._id)}
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
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

export default DashboardInputPS;
