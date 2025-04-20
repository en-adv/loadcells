import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { format, parseISO, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { id } from "date-fns/locale";
import { FaSearch, FaSort, FaSortUp, FaSortDown, FaFileExcel, FaChartLine, FaBalanceScale, FaWeight, FaMoneyBillWave } from "react-icons/fa";
import * as XLSX from 'xlsx';
import { checkSession, updateLastActivity } from '../utils/sessionManager';

const API_URL = process.env.REACT_APP_API_URL;

const SPSummary = () => {
    const [entries, setEntries] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [dateTotals, setDateTotals] = useState({
        totalNetGross: 0,
        totalNetWeight: 0,
        totalRejectedWeight: 0,
        totalAmount: 0
    });
    const [adminDateTotals, setAdminDateTotals] = useState({
        totalNetto: 0,
        totalNettoBersih: 0,
        totalHarga: 0
    });

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

    useEffect(() => {
        // Fetch SP data
        axios.get(`${API_URL}/api/sp`)
            .then((res) => setEntries(res.data))
            .catch((err) => console.error("Error fetching SP data:", err));

        // Fetch Admin Dashboard totals
        axios.get(`${API_URL}/api/vehicles`)
            .then((res) => {
                const vehicles = res.data;
                setAdminTotals(vehicles.reduce((acc, vehicle) => {
                    const netto = vehicle.bruto && vehicle.tar ? vehicle.bruto - vehicle.tar : 0;
                    const potongannetto = (netto * (vehicle.discount || 0)) / 100;
                    const nettobersih = Math.round(netto - potongannetto);
                    
                    return {
                        totalNetto: acc.totalNetto + netto,
                        totalNettoBersih: acc.totalNettoBersih + nettobersih,
                        totalHarga: acc.totalHarga + (vehicle.totalPrice || 0)
                    };
                }, {
                    totalNetto: 0,
                    totalNettoBersih: 0,
                    totalHarga: 0
                }));
            })
            .catch((err) => console.error("Error fetching admin totals:", err));
    }, []);

    useEffect(() => {
        // Calculate totals for selected date
        const startDate = startOfDay(selectedDate);
        const endDate = endOfDay(selectedDate);

        // Calculate SP totals for selected date
        const dateEntries = entries.filter(entry => {
            const entryDate = entry.date ? parseISO(entry.date) : null;
            return entryDate && isWithinInterval(entryDate, { start: startDate, end: endDate });
        });

        const totals = dateEntries.reduce((acc, entry) => ({
            totalNetGross: acc.totalNetGross + (parseFloat(entry.netGross) || 0),
            totalNetWeight: acc.totalNetWeight + (parseFloat(entry.netWeight) || 0),
            totalRejectedWeight: acc.totalRejectedWeight + (parseFloat(entry.rejectedWeight) || 0),
            totalAmount: acc.totalAmount + (parseFloat(entry.total) || 0)
        }), {
            totalNetGross: 0,
            totalNetWeight: 0,
            totalRejectedWeight: 0,
            totalAmount: 0
        });

        setDateTotals(totals);

        // Calculate Admin totals for selected date
        axios.get(`${API_URL}/api/vehicles`)
            .then((res) => {
                const vehicles = res.data.filter(vehicle => {
                    const vehicleDate = vehicle.date ? parseISO(vehicle.date) : null;
                    return vehicleDate && isWithinInterval(vehicleDate, { start: startDate, end: endDate });
                });

                const adminTotals = vehicles.reduce((acc, vehicle) => {
                    const netto = vehicle.bruto && vehicle.tar ? vehicle.bruto - vehicle.tar : 0;
                    const potongannetto = (netto * (vehicle.discount || 0)) / 100;
                    const nettobersih = Math.round(netto - potongannetto);
                    
                    return {
                        totalNetto: acc.totalNetto + netto,
                        totalNettoBersih: acc.totalNettoBersih + nettobersih,
                        totalHarga: acc.totalHarga + (vehicle.totalPrice || 0)
                    };
                }, {
                    totalNetto: 0,
                    totalNettoBersih: 0,
                    totalHarga: 0
                });

                setAdminDateTotals(adminTotals);
            })
            .catch((err) => console.error("Error fetching admin date totals:", err));
    }, [entries, selectedDate]);

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

    const downloadExcel = () => {
        // Main data sheet
        const mainData = filteredData.map(item => ({
            'Tanggal': item.date ? format(parseISO(item.date), 'dd/MM/yyyy HH:mm', { locale: id }) : '-',
            'Doc Reference': item.docReference || '-',
            'Vehicle ID': item.vehicleId || '-',
            'Netto Kotor (Kg)': item.netGross || '0',
            'Upah Bongkar (Rp)': (parseFloat(item.netGross) || 0) * 16,
            'Berat Muat (Kg)': item.rejectedWeight || '0',
            'Upah Muat (Rp)': (parseFloat(item.rejectedWeight) || 0) * 8,
            'Total Upah (Rp)': ((parseFloat(item.netGross) || 0) * 16) + ((parseFloat(item.rejectedWeight) || 0) * 8),
            'Netto Bersih (Kg)': item.netWeight || '0',
            'Total Cash SP (Rp)': item.total || '0',
            'Harga (Rp)': item.price || '0',
            'Komidel (Kg/Tdn)': item.komidel || '0',
            'PPH': item.pph || '0'
        }));

        // Add summary row to main data
        const summaryRow = {
            'Tanggal': 'TOTAL',
            'Doc Reference': '',
            'Vehicle ID': '',
            'Netto Kotor (Kg)': dateTotals.totalNetGross,
            'Upah Bongkar (Rp)': dateTotals.totalNetGross * 16,
            'Berat Muat (Kg)': dateTotals.totalRejectedWeight,
            'Upah Muat (Rp)': dateTotals.totalRejectedWeight * 8,
            'Total Upah (Rp)': (dateTotals.totalNetGross * 16) + (dateTotals.totalRejectedWeight * 8),
            'Netto Bersih (Kg)': dateTotals.totalNetWeight,
            'Total Cash SP (Rp)': dateTotals.totalAmount,
            'Harga (Rp)': '',
            'Komidel (Kg/Tdn)': '',
            'PPH': ''
        };
        mainData.push(summaryRow);

        // Create workbook
        const wb = XLSX.utils.book_new();

        // Create main data sheet
        const wsMain = XLSX.utils.json_to_sheet(mainData);
        
        // Set column widths for main sheet
        const colWidths = [
            { wch: 20 }, // Tanggal
            { wch: 15 }, // Doc Reference
            { wch: 15 }, // Vehicle ID
            { wch: 15 }, // Netto Kotor
            { wch: 20 }, // Upah Bongkar
            { wch: 15 }, // Berat Muat
            { wch: 20 }, // Upah Muat
            { wch: 20 }, // Total Upah
            { wch: 15 }, // Netto Bersih
            { wch: 20 }, // Total Cash SP
            { wch: 15 }, // Harga
            { wch: 15 }, // Komidel
            { wch: 10 }  // PPH
        ];
        wsMain['!cols'] = colWidths;

        // Add comparison data sheet
        const comparisonData = [
            {
                'Metrik': 'Netto Kotor',
                'Rangkuman SP (Kg)': dateTotals.totalNetGross,
                'Timbangan Operator (Kg)': adminDateTotals.totalNetto,
                'Selisih (Kg)': nettoDifference.value,
                'Persentase (%)': nettoDifference.percentage
            },
            {
                'Metrik': 'Netto Bersih',
                'Rangkuman SP (Kg)': dateTotals.totalNetWeight,
                'Timbangan Operator (Kg)': adminDateTotals.totalNettoBersih,
                'Selisih (Kg)': nettoBersihDifference.value,
                'Persentase (%)': nettoBersihDifference.percentage
            },
            {
                'Metrik': 'Total Cash',
                'Rangkuman SP (Rp)': dateTotals.totalAmount,
                'Timbangan Operator (Rp)': adminDateTotals.totalHarga,
                'Selisih (Rp)': hargaDifference.value,
                'Persentase (%)': hargaDifference.percentage
            },
            {
                'Metrik': 'Upah Bongkar',
                'Rangkuman SP (Rp)': dateTotals.totalNetGross * 16,
                'Timbangan Operator (Rp)': adminDateTotals.totalNetto * 16,
                'Selisih (Rp)': (dateTotals.totalNetGross - adminDateTotals.totalNetto) * 16,
                'Persentase (%)': adminDateTotals.totalNetto !== 0 ? 
                    (((dateTotals.totalNetGross - adminDateTotals.totalNetto) / adminDateTotals.totalNetto) * 100).toFixed(2) : 0
            },
            {
                'Metrik': 'Upah Muat',
                'Rangkuman SP (Rp)': dateTotals.totalRejectedWeight * 8,
                'Timbangan Operator (Rp)': adminDateTotals.totalNettoBersih * 8,
                'Selisih (Rp)': (dateTotals.totalRejectedWeight - adminDateTotals.totalNettoBersih) * 8,
                'Persentase (%)': adminDateTotals.totalNettoBersih !== 0 ? 
                    (((dateTotals.totalRejectedWeight - adminDateTotals.totalNettoBersih) / adminDateTotals.totalNettoBersih) * 100).toFixed(2) : 0
            }
        ];

        const wsComparison = XLSX.utils.json_to_sheet(comparisonData);
        wsComparison['!cols'] = [
            { wch: 15 }, // Metrik
            { wch: 20 }, // Rangkuman SP
            { wch: 20 }, // Timbangan Operator
            { wch: 15 }, // Selisih
            { wch: 15 }  // Persentase
        ];

        // Add metadata sheet
        const metadata = [
            { 'Informasi': 'Tanggal Backup', 'Nilai': format(new Date(), 'dd/MM/yyyy HH:mm:ss') },
            { 'Informasi': 'Jumlah Data', 'Nilai': filteredData.length },
            { 'Informasi': 'Total Netto Kotor', 'Nilai': `${dateTotals.totalNetGross.toLocaleString()} Kg` },
            { 'Informasi': 'Total Upah Bongkar', 'Nilai': `Rp ${(dateTotals.totalNetGross * 16).toLocaleString()}` },
            { 'Informasi': 'Total Berat Muat', 'Nilai': `${dateTotals.totalRejectedWeight.toLocaleString()} Kg` },
            { 'Informasi': 'Total Upah Muat', 'Nilai': `Rp ${(dateTotals.totalRejectedWeight * 8).toLocaleString()}` },
            { 'Informasi': 'Total Upah', 'Nilai': `Rp ${((dateTotals.totalNetGross * 16) + (dateTotals.totalRejectedWeight * 8)).toLocaleString()}` },
            { 'Informasi': 'Total Netto Bersih', 'Nilai': `${dateTotals.totalNetWeight.toLocaleString()} Kg` },
            { 'Informasi': 'Total Cash SP', 'Nilai': `Rp ${dateTotals.totalAmount.toLocaleString()}` }
        ];

        const wsMetadata = XLSX.utils.json_to_sheet(metadata);
        wsMetadata['!cols'] = [
            { wch: 20 }, // Informasi
            { wch: 30 }  // Nilai
        ];

        // Apply styles to all sheets
        const applyStyles = (ws) => {
            const range = XLSX.utils.decode_range(ws['!ref']);
            
            // Header style
            const headerStyle = {
                font: { bold: true },
                fill: { fgColor: { rgb: "E6E6E6" } }
            };

            // Apply header style
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const address = XLSX.utils.encode_col(C) + '1';
                if (!ws[address]) continue;
                ws[address].s = headerStyle;
            }

            // Apply bold to last row if it's the main data sheet
            if (ws === wsMain) {
                const lastRow = mainData.length;
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const address = XLSX.utils.encode_col(C) + lastRow;
                    if (!ws[address]) continue;
                    ws[address].s = { font: { bold: true } };
                }
            }
        };

        applyStyles(wsMain);
        applyStyles(wsComparison);
        applyStyles(wsMetadata);

        // Add sheets to workbook
        XLSX.utils.book_append_sheet(wb, wsMain, "Data Utama");
        XLSX.utils.book_append_sheet(wb, wsComparison, "Perbandingan");
        XLSX.utils.book_append_sheet(wb, wsMetadata, "Metadata");

        // Save file
        XLSX.writeFile(wb, `Backup_Rangkuman_SP_${format(new Date(), 'dd-MM-yyyy_HH-mm')}.xlsx`);
    };

    const calculateDifference = (spValue, adminValue) => {
        const difference = spValue - adminValue;
        const percentage = adminValue !== 0 ? ((difference / adminValue) * 100).toFixed(2) : 0;
        return {
            value: difference,
            percentage: percentage,
            isPositive: difference > 0
        };
    };

    const nettoDifference = calculateDifference(dateTotals.totalNetWeight, adminDateTotals.totalNetto);
    const nettoBersihDifference = calculateDifference(dateTotals.totalNetWeight, adminDateTotals.totalNettoBersih);
    const hargaDifference = calculateDifference(dateTotals.totalAmount, adminDateTotals.totalHarga);

    return (
        <div className="container-fluid mt-4">
            {/* Header Section */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <h2 className="mb-0" style={{ 
                                    color: '#2D336B',
                                    fontFamily: 'Kanit, sans-serif',
                                    fontWeight: 'bold'
                                }}>
                                    Surat Pengantar Digital
                                </h2>
                                <div className="d-flex align-items-center">
                                    <label htmlFor="datePicker" className="me-2">Pilih Tanggal Data:</label>
                                    <input
                                        type="date"
                                        id="datePicker"
                                        className="form-control"
                                        value={format(selectedDate, 'yyyy-MM-dd')}
                                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                                        style={{ width: '200px' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comparison Section */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card shadow-sm">
                        <div className="card-header bg-white border-0 py-3">
                            <h4 className="mb-0" style={{ 
                                color: '#2D336B',
                                fontFamily: 'Kanit, sans-serif',
                                fontWeight: 'bold'
                            }}>
                                <FaChartLine className="me-2" />
                                Perbandingan Data
                            </h4>
                        </div>
                        <div className="card-body">
                            <div className="row g-4">
                                <div className="col-md-4">
                                    <div className="card h-100 border-0 shadow-sm">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center mb-3">
                                                <div className="icon-circle bg-primary text-white me-3">
                                                    <FaWeight />
                                                </div>
                                                <h5 className="card-title mb-0">Netto Kotor</h5>
                                            </div>
                                            <div className="comparison-details">
                                                <div className="d-flex justify-content-between mb-2">
                                                    <span className="text-muted">Rangkuman SP</span>
                                                    <span className="fw-bold">{dateTotals.totalNetGross.toLocaleString()} Kg</span>
                                                </div>
                                                <div className="d-flex justify-content-between mb-3">
                                                    <span className="text-muted">Timbangan Operator</span>
                                                    <span className="fw-bold">{adminDateTotals.totalNetto.toLocaleString()} Kg</span>
                                                </div>
                                                <div className={`difference-badge ${nettoDifference.isPositive ? 'bg-success' : 'bg-danger'}`}>
                                                    <span className="fw-bold">
                                                        {nettoDifference.isPositive ? '+' : ''}{nettoDifference.value.toLocaleString()} Kg
                                                        <br />
                                                        ({nettoDifference.percentage}%)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="card h-100 border-0 shadow-sm">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center mb-3">
                                                <div className="icon-circle bg-success text-white me-3">
                                                    <FaBalanceScale />
                                                </div>
                                                <h5 className="card-title mb-0">Netto Bersih</h5>
                                            </div>
                                            <div className="comparison-details">
                                                <div className="d-flex justify-content-between mb-2">
                                                    <span className="text-muted">Rangkuman SP</span>
                                                    <span className="fw-bold">{dateTotals.totalNetWeight.toLocaleString()} Kg</span>
                                                </div>
                                                <div className="d-flex justify-content-between mb-3">
                                                    <span className="text-muted">Timbangan Operator</span>
                                                    <span className="fw-bold">{adminDateTotals.totalNettoBersih.toLocaleString()} Kg</span>
                                                </div>
                                                <div className={`difference-badge ${nettoBersihDifference.isPositive ? 'bg-success' : 'bg-danger'}`}>
                                                    <span className="fw-bold">
                                                        {nettoBersihDifference.isPositive ? '+' : ''}{nettoBersihDifference.value.toLocaleString()} Kg
                                                        <br />
                                                        ({nettoBersihDifference.percentage}%)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="card h-100 border-0 shadow-sm">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center mb-3">
                                                <div className="icon-circle bg-danger text-white me-3">
                                                    <FaMoneyBillWave />
                                                </div>
                                                <h5 className="card-title mb-0">Total Cash Operator</h5>
                                            </div>
                                            <div className="comparison-details">
                                                <div className="d-flex justify-content-between mb-2">
                                                    <span className="text-muted">Total Cash SP</span>
                                                    <span className="fw-bold">Rp {dateTotals.totalAmount.toLocaleString()}</span>
                                                </div>
                                                <div className="d-flex justify-content-between mb-3">
                                                    <span className="text-muted">Total Cash Operator</span>
                                                    <span className="fw-bold">Rp {adminDateTotals.totalHarga.toLocaleString()}</span>
                                                </div>
                                                <div className={`difference-badge ${hargaDifference.isPositive ? 'bg-success' : 'bg-danger'}`}>
                                                    <span className="fw-bold">
                                                        {hargaDifference.isPositive ? '+' : ''}Rp {hargaDifference.value.toLocaleString()}
                                                        <br />
                                                        ({hargaDifference.percentage}%)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="row mb-4">
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center mb-3">
                                <div className="icon-circle bg-primary text-white me-3">
                                    <FaWeight />
                                </div>
                                <h5 className="card-title mb-0">Netto Kotor</h5>
                            </div>
                            <h3 className="mb-0">{dateTotals.totalNetGross.toLocaleString()} Kg</h3>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center mb-3">
                                <div className="icon-circle bg-success text-white me-3">
                                    <FaBalanceScale />
                                </div>
                                <h5 className="card-title mb-0">Netto Bersih</h5>
                            </div>
                            <h3 className="mb-0">{dateTotals.totalNetWeight.toLocaleString()} Kg</h3>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center mb-3">
                                <div className="icon-circle bg-warning text-white me-3">
                                    <FaWeight />
                                </div>
                                <h5 className="card-title mb-0">Berat Muat</h5>
                            </div>
                            <h3 className="mb-0">{dateTotals.totalRejectedWeight.toLocaleString()} Kg</h3>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center mb-3">
                                <div className="icon-circle bg-danger text-white me-3">
                                    <FaMoneyBillWave />
                                </div>
                                <h5 className="card-title mb-0">Total Cash SP</h5>
                            </div>
                            <h3 className="mb-0">Rp {dateTotals.totalAmount.toLocaleString()}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upah Cards */}
            <div className="row mb-4">
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center mb-3">
                                <div className="icon-circle bg-info text-white me-3">
                                    <FaMoneyBillWave />
                                </div>
                                <h5 className="card-title mb-0">Upah Bongkar</h5>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <p className="mb-1 text-muted">Netto Kotor × 16</p>
                                    <p className="mb-0 text-muted">{dateTotals.totalNetGross.toLocaleString()} Kg × 16</p>
                                </div>
                                <h3 className="mb-0">Rp {(dateTotals.totalNetGross * 16).toLocaleString()}</h3>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center mb-3">
                                <div className="icon-circle bg-info text-white me-3">
                                    <FaMoneyBillWave />
                                </div>
                                <h5 className="card-title mb-0">Upah Muat</h5>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <p className="mb-1 text-muted">Berat Muat × 8</p>
                                    <p className="mb-0 text-muted">{dateTotals.totalRejectedWeight.toLocaleString()} Kg × 8</p>
                                </div>
                                <h3 className="mb-0">Rp {(dateTotals.totalRejectedWeight * 8).toLocaleString()}</h3>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Export */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-md-8">
                                    <div className="input-group">
                                        <span className="input-group-text bg-white border-end-0">
                                            <FaSearch className="text-muted" />
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control border-start-0"
                                            placeholder="Search by Doc Reference or Vehicle ID"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <button 
                                        className="btn btn-success w-100 d-flex align-items-center justify-content-center"
                                        onClick={downloadExcel}
                                    >
                                        <FaFileExcel className="me-2" />
                                        Export to Excel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="row">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead>
                                        <tr className="table-light">
                                            <th onClick={() => handleSort("date")} style={{ cursor: "pointer" }} className="text-nowrap">
                                                Tanggal
                                                {sortConfig.key === "date" && (
                                                    sortConfig.direction === "asc" ? <FaSortUp className="ms-1" /> : <FaSortDown className="ms-1" />
                                                )}
                                                {sortConfig.key !== "date" && <FaSort className="ms-1" />}
                                            </th>
                                            <th onClick={() => handleSort("docReference")} style={{ cursor: "pointer" }} className="text-nowrap">
                                                Doc Reference
                                                {sortConfig.key === "docReference" && (
                                                    sortConfig.direction === "asc" ? <FaSortUp className="ms-1" /> : <FaSortDown className="ms-1" />
                                                )}
                                                {sortConfig.key !== "docReference" && <FaSort className="ms-1" />}
                                            </th>
                                            <th onClick={() => handleSort("vehicleId")} style={{ cursor: "pointer" }} className="text-nowrap">
                                                Vehicle ID
                                                {sortConfig.key === "vehicleId" && (
                                                    sortConfig.direction === "asc" ? <FaSortUp className="ms-1" /> : <FaSortDown className="ms-1" />
                                                )}
                                                {sortConfig.key !== "vehicleId" && <FaSort className="ms-1" />}
                                            </th>
                                            <th className="text-end">Weight In</th>
                                            <th className="text-end">Weight Out</th>
                                            <th className="text-end">Net Gross</th>
                                            <th className="text-end">Loose Weight</th>
                                            <th className="text-end">Komidel</th>
                                            <th className="text-end">Penalty</th>
                                            <th className="text-end">Net Weight</th>
                                            <th className="text-end">Price</th>
                                            <th className="text-end">(0.25%)</th>
                                            <th className="text-end">Rejected Weight</th>
                                            <th className="text-end">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredData.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.date ? format(parseISO(item.date), 'dd/MM/yyyy HH:mm', { locale: id }) : '-'}</td>
                                                <td>{item.docReference || '-'}</td>
                                                <td>{item.vehicleId || '-'}</td>
                                                <td className="text-end">{item.weightIn || '0'}</td>
                                                <td className="text-end">{item.weightOut || '0'}</td>
                                                <td className="text-end">{item.netGross || '0'}</td>
                                                <td className="text-end">{item.looseWeight || '0'}</td>
                                                <td className="text-end">{item.komidel || '0'}</td>
                                                <td className="text-end">{item.penalty || '0'}</td>
                                                <td className="text-end">{item.netWeight || '0'}</td>
                                                <td className="text-end">{item.price || '0'}</td>
                                                <td className="text-end">{item.pph || '0'}</td>
                                                <td className="text-end">{item.rejectedWeight || '0'}</td>
                                                <td className="text-end">{item.total || '0'}</td>
                                               
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .icon-circle {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                }
                .difference-badge {
                    padding: 0.5rem;
                    border-radius: 0.5rem;
                    text-align: center;
                    color: white;
                }
                .card {
                    transition: transform 0.2s ease-in-out;
                }
                .card:hover {
                    transform: translateY(-2px);
                }
                .table th {
                    background-color: #f8f9fa;
                    color: #2D336B;
                    font-weight: 600;
                }
                .table td {
                    vertical-align: middle;
                }
                .input-group-text {
                    border-right: none;
                }
                .form-control {
                    border-left: none;
                }
                .form-control:focus {
                    box-shadow: none;
                    border-color: #ced4da;
                }
            `}</style>
        </div>
    );
};

export default SPSummary; 