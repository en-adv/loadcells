import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../firebaseConfig";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css"; // Import Bootstrap
import { checkSession, updateLastActivity, clearSession } from '../utils/sessionManager';
const API_URL = process.env.REACT_APP_API_URL;
const OperatorDashboard4 = () => {
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
    const [currentVehicle, setCurrentVehicle] = useState(null);
    const [inputStatus, setInputStatus] = useState(""); // New state for input status
    const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);

    // Fetch Load Cell Data from Firebase
    useEffect(() => {
        const loadCellRef = ref(db, "Binanga/berat");
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
        const operator = "Binanga"; // Sesuaikan atau ambil dari JWT
        axios.get(`${API_URL}/api/price/${operator}`)   
            .then((res) => {
                if (res.data && res.data.price !== undefined) {
                    setPricePerKg(res.data.price);
                }
            })
            .catch((err) => console.error("Error fetching operator price:", err));
    }, []);

    useEffect(() => {
        const operator = "Binanga";  // Make sure it's dynamically assigned
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
        const operator = "Binanga"; // Adjust dynamically if needed
        const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
    
        axios.get(`${API_URL}/api/vehicles`)
            .then((res) => {
                // Filter data to only include today's records
                const todaysVehicles = res.data.filter(vehicle => 
                    vehicle.operator === operator &&
                    vehicle.date &&
                    new Date(vehicle.date).toISOString().split("T")[0] === today
                );
    
                // Calculate today's total netto
                const todayTotal = todaysVehicles.reduce(
                    (sum, vehicle) => sum + (vehicle.bruto && vehicle.tar ? vehicle.bruto - vehicle.tar : 0),
                    0
                );
    
                setTotalNetto(todayTotal);
    
                // Fetch last threshold from DB
                axios.get(`${API_URL}/api/threshold/${operator}`)
                    .then((thresholdRes) => {
                        const lastThreshold = thresholdRes.data?.lastThreshold || 0;
                        let nextThreshold = Math.floor(todayTotal / 30000) * 30000;
    
                        if (todayTotal >= nextThreshold && nextThreshold > lastThreshold) {
                            console.log("🎉 Showing notification!");
                            setShowNotification(true);
    
                            // Update threshold in the database
                            axios.post(`${API_URL}/api/threshold`, { operator, lastThreshold: nextThreshold })
                                .catch(err => console.error("Error updating threshold:", err));
                        }
                    })
                    .catch(err => console.error("Error fetching threshold:", err));
            })
            .catch(err => console.error("Error fetching vehicles:", err));
    }, [vehicles]); // Runs when vehicles update
    
    

    const handleNotificationDismiss = () => {
        setShowNotification(false);
    };
    
    const handlePrint = async (vehicle) => {
        try {
            // 1. Request a Bluetooth Device
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ["000018f0-0000-1000-8000-00805f9b34fb"], // ESC/POS UUID
            });
            const finalPrice = vehicle.nettobersih * vehicle.pricePerKg;
            // 2. Connect to Bluetooth Device
            const server = await device.gatt.connect();
            const service = await server.getPrimaryService("000018f0-0000-1000-8000-00805f9b34fb");
            const characteristic = await service.getCharacteristic("00002af1-0000-1000-8000-00805f9b34fb");
            // 3. Generate Invoice Text with Proper ESC/POS Formatting
                        const ESC = "\x1B";
            const CENTER = ESC + "\x61\x01";
            const LEFT = ESC + "\x61\x00";
            const BOLD_ON = ESC + "\x45\x01";
            const BOLD_OFF = ESC + "\x45\x00";
            const FONT_DOUBLE = ESC + "\x21\x21"; // Double height & width
            const FONT_NORMAL = ESC + "\x21\x21";
            const LINE_FEED = "\n";
            const SEPARATOR = "================================\n"; 

    
                    const invoiceText =
            LINE_FEED +
            CENTER + FONT_DOUBLE + "Slip Pembayaran TBS\n" + FONT_NORMAL +
            CENTER + BOLD_ON + " * Bintang Sawit Makmur *\n" + BOLD_OFF +
            SEPARATOR +
            CENTER + "Binanga HP. (0853 5809 7813)\n" +
            LINE_FEED +
            LEFT +
            `Tanggal    : ${new Date(vehicle.date).toLocaleString("id-ID")}\n` +
            `No Polisi     : ${vehicle.plateNumber}\n` +
            `Bruto         : ${vehicle.bruto} Kg\n` +
            `Tarra         : ${vehicle.tar} Kg\n` +
            `Netto         : ${vehicle.bruto - vehicle.tar} Kg\n` +
            `Potongan      : ${vehicle.discount}%\n` +
            `Harga/Kg      : Rp ${vehicle.pricePerKg.toLocaleString()}\n` +
            `Netto Bersih  : ${vehicle.nettobersih.toLocaleString()} Kg\n` +
            FONT_DOUBLE + `Total         : Rp ${finalPrice.toLocaleString()}\n` + FONT_NORMAL +
            LINE_FEED +
            SEPARATOR +
            CENTER + "NB: Tidak Menerima Buah Curian !\n" +
            CENTER + "Terima Kasih!\n" +
            LINE_FEED.repeat(3);

            // 4. Encode and Send Data to Printer
            let encoder = new TextEncoder();
            let data = encoder.encode(invoiceText);
            await characteristic.writeValue(data);
    
            alert("Nota Terkirim ke Printer ✅");
        } catch (error) {
            console.error("Bluetooth Print Error: ", error);
            alert("Gagal Mencetak Nota ❌");
        }
    };
    

    const totalPembayaran = vehicles
    .filter(v => v.operator === "Binanga" && v.nettobersih && v.pricePerKg)
    .reduce((sum, v) => sum + v.nettobersih * v.pricePerKg, 0);
  
    const totalNettoBersih = vehicles
    .filter(v => v.operator === "Binanga" && v.nettobersih)
    .reduce((sum, v) => sum + v.nettobersih, 0);
  
    // Add this new function to check vehicle status
    const checkVehicleStatus = (plateNumber) => {
        const today = new Date().toISOString().split('T')[0];
        const vehicle = vehicles.find(v => 
            v.plateNumber === plateNumber && 
            v.date && 
            new Date(v.date).toISOString().split('T')[0] === today
        );

        if (vehicle) {
            if (vehicle.bruto && !vehicle.tar) {
                setInputStatus("Menunggu Tarra");
                setSelectedType("Tar");
            } else if (vehicle.bruto && vehicle.tar) {
                setInputStatus("Selesai");
            } else {
                setInputStatus("Menunggu Bruto");
                setSelectedType("Bruto");
            }
            setCurrentVehicle(vehicle);
        } else {
            setInputStatus("Kendaraan Baru");
            setSelectedType("Bruto");
            setCurrentVehicle(null);
        }
    };

    // Modify the plateNumber onChange handler
    const handlePlateNumberChange = (e) => {
        const value = e.target.value.toUpperCase().replace(/\s/g, "");
        setPlateNumber(value);
        checkVehicleStatus(value);
    };

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

    // Update handleSubmit to check session
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!checkSession()) {
            return;
        }

        if (!plateNumber) {
            alert("Masukkan Nomor Kendaraan");
            return;
        }

        if (loadCell <= 0) {
            alert("Berat tidak valid. Pastikan timbangan terhubung dan menunjukkan nilai yang benar.");
            return;
        }

        const operator = "Binanga";
        const today = new Date().toISOString().split('T')[0];
        const vehicle = vehicles.find(v => 
            v.plateNumber === plateNumber && 
            v.date && 
            new Date(v.date).toISOString().split('T')[0] === today
        );

        // Validate input sequence
        if (selectedType === "Tar" && (!vehicle || !vehicle.bruto)) {
            alert("Bruto harus diinput terlebih dahulu sebelum Tarra");
            return;
        }

        if (selectedType === "Bruto" && vehicle && vehicle.bruto) {
            alert("Bruto sudah diinput sebelumnya");
            return;
        }

        const payload = {
            plateNumber,
            weight: loadCell,
            type: selectedType,
            pricePerKg,
            discount,
            operator,
            date: new Date().toISOString() // Add current timestamp
        };

        axios.post(`${API_URL}/api/vehicles`, payload)
            .then(() => {
                setPlateNumber("");
                setInputStatus("");
                setCurrentVehicle(null);
                axios.get(`${API_URL}/api/vehicles`).then(res => {
                    setVehicles(res.data);
                    checkVehicleStatus(plateNumber);
                });
            })
            .catch(err => {
                console.error("Error submitting data:", err);
                alert(err.response?.data?.message || "Terjadi kesalahan saat menyimpan data");
            });
    };

    // Add clear form function
    const handleClearForm = () => {
        setPlateNumber("");
        setSelectedType("Bruto");
        setInputStatus("");
        setCurrentVehicle(null);
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
                                <p>Total berat sawit <strong>{totalNetto.toLocaleString()}</strong> kg! dan telah mencapai lebih dari 30 Ton.</p>
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
                            <h5 className="card-title">Timbangan Binanga</h5>
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
                <div className="col-md-4 mb-3">
                    <div className="card text-center">
                        <div className="card-body">
                            <h5 className="card-title">Total Netto Kotor</h5>
                            <h3 className="text-success"> {totalNetto.toLocaleString()} Kg</h3>
                        </div>
                    </div>
                </div>
                <div className="col-md-4 mb-3">
                    <div className="card text-center">
                        <div className="card-body">
                            <h5 className="card-title">Total Netto Bersih</h5>
                            <h3 className="text-success"> {totalNettoBersih.toLocaleString()} Kg</h3>
                        </div>
                    </div>
                </div>
                <div className="col-md-4 mb-3">
                    <div className="card text-center">
                        <div className="card-body">
                            <h5 className="card-title">Total Pembayaran</h5>
                            <h3 className="text-success">Rp {totalPembayaran.toLocaleString()}</h3>
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
                        onChange={handlePlateNumberChange}
                    />
                    {inputStatus && (
                        <div className="mt-2 p-2 rounded bg-success text-white">
                            Status: {inputStatus}
                        </div>
                    )}
                </div>

                <div className="col-md-4">
                    <label>Pilih Jenis Berat:</label>
                    <select
                        className="form-select"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        disabled={inputStatus === "Selesai"}
                    >
                        <option value="Bruto">Bruto</option>
                        <option value="Tar">Tar</option>
                    </select>
                </div>

                <div className="col-md-2 d-grid gap-2">
                    <button className="btn kirim-button mt-4" onClick={handleSubmit}>
                        KIRIM
                    </button>
                    <button className="btn btn-secondary" onClick={handleClearForm}>
                        CLEAR
                    </button>
                </div>
            </div>

            {/* Search and Filter Section */}
            <div className="row mt-3">
                <div className="col-md-8">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Cari Nomor Kendaraan"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="col-md-4">
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="showIncomplete"
                            checked={showIncompleteOnly}
                            onChange={(e) => setShowIncompleteOnly(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="showIncomplete">
                            Tampilkan Kendaraan Belum Lengkap
                        </label>
                    </div>
                </div>
            </div>

            {/* Vehicle Table */}
            <h4 className="mt-2">Kendaraan Terdaftar</h4>
            <div className="table-responsive">
                <table className="table custom-table">
                    <thead className="custom-thead">    
                        <tr>
                            <th>Tanggal</th>
                            <th>Nomor Polisi</th>
                            <th>Brutto</th>
                            <th>Tarra</th>
                            <th>Netto</th>
                            <th>Potongan (%)</th>       
                            <th>Harga/Kg</th>
                            <th>Netto Bersih</th>
                            <th>Total</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vehicles
                            .filter(vehicle => vehicle.operator === "Binanga")
                            .filter(vehicle => {
                                if (showIncompleteOnly) {
                                    return vehicle.bruto && !vehicle.tar;
                                }
                                return true;
                            })
                            .filter(vehicle => vehicle.plateNumber.includes(search.toUpperCase()))
                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                            .map((vehicle, index) => {
                                const netto = vehicle.bruto && vehicle.tar ? vehicle.bruto - vehicle.tar : 0;
                                const finalPrice = vehicle.nettobersih * vehicle.pricePerKg;

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
                                        <td>{vehicle.plateNumber}</td>
                                        <td>{vehicle.bruto || "-"} Kg</td>
                                        <td>{vehicle.tar || "-"} Kg</td>
                                        <td>{netto || "-"} Kg</td> 
                                        <td>{vehicle.discount !== undefined ? vehicle.discount : "0"}%</td>
                                        <td>Rp {vehicle.pricePerKg.toLocaleString() || "-"}</td> 
                                        <td>{vehicle.nettobersih || "-"} Kg</td>
                                        <td>Rp {finalPrice.toLocaleString()}</td>
                                        <td>
                                            <button className="btn btn-primary btn-sm" onClick={() => handlePrint(vehicle)}>
                                                Print Nota 🖨️
                                            </button>
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

export default OperatorDashboard4;
