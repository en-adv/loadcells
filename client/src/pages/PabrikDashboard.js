import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

const API_URL = process.env.REACT_APP_API_URL;

const DashboardInput = () => {
    const [plateNumber, setPlateNumber] = useState("");
    const [bruto, setBruto] = useState("");
    const [tar, setTar] = useState("");
    const [discount, setDiscount] = useState("");
    const [pricePerKg, setPricePerKg] = useState("");
    const [search, setSearch] = useState("");
    const [vehicles, setVehicles] = useState([]);

    useEffect(() => {
        axios.get(`${API_URL}/api/vehicles`)
            .then((res) => setVehicles(res.data))
            .catch((err) => console.error("Error fetching vehicles:", err));
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.href = "/";
    };
    const handleSubmit = () => {
        if (!plateNumber || (!bruto && !tar) || !discount || !pricePerKg) {
            alert("Semua field harus diisi!");
            return;
        }
    
        const payload = {
            plateNumber,
            bruto: bruto ? Number(bruto) : null,
            tar: tar ? Number(tar) : null,
            pricePerKg: Number(pricePerKg),
            discount: Number(discount),
            operator: "Pabrik",
        };
    
        axios.post(`${API_URL}/api/vehicles`, payload)
            .then(() => {
                setPlateNumber("");
                setBruto("");
                setTar("");
                setDiscount("");
                setPricePerKg("");
    
                // Refresh daftar kendaraan
                axios.get(`${API_URL}/api/vehicles`).then(res => setVehicles(res.data));
            })
            .catch(err => console.error("Error submitting data:", err));
    };
    
    

    const handlePrint = async (vehicle) => {
        try {
            // 1. Request a Bluetooth Device
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ["000018f0-0000-1000-8000-00805f9b34fb"], // ESC/POS UUID
            });
    
            // 2. Connect to Bluetooth Device
            const server = await device.gatt.connect();
            const service = await server.getPrimaryService("000018f0-0000-1000-8000-00805f9b34fb");
            const characteristic = await service.getCharacteristic("00002af1-0000-1000-8000-00805f9b34fb");
            // 3. Generate Invoice Text with Proper ESC/POS Formatting
            const ESC = "\x1B"; // ESC POS Command
            const CENTER = ESC + "\x61\x01"; // Center Text
            const LEFT = ESC + "\x61\x00"; // Left Align Text
            const BOLD_ON = ESC + "\x45\x01"; // Bold Text On
            const BOLD_OFF = ESC + "\x45\x00"; // Bold Text Off
            const LINE_FEED = "\n"; // New Line
            const SEPARATOR = "================================\n"; // Separator Line
    
            const invoiceText =
                LINE_FEED +
                CENTER + BOLD_ON + "Slip Timbangan TBS\n" + BOLD_OFF +
                CENTER + BOLD_ON + " * Sawit Makmur *\n" + BOLD_OFF +
                SEPARATOR +
                CENTER + BOLD_ON + "Pabrik\n" + BOLD_OFF +
                LINE_FEED +
                LEFT + `Tanggal   : ${new Date(vehicle.date).toLocaleString("id-ID")}\n` +
                `No Polisi    : ${vehicle.plateNumber}\n` +
                `Bruto        : ${vehicle.bruto} Kg\n` +
                `Tarra        : ${vehicle.tar} Kg\n` +
                `Netto        : ${vehicle.bruto - vehicle.tar} Kg\n` +
                `Potongan     : ${vehicle.discount}%\n` +
                `Harga/Kg     : Rp ${vehicle.pricePerKg.toLocaleString()}\n` +
                `Netto Bersih : ${vehicle.nettobersih.toLocaleString()} Kg\n` +
                LINE_FEED +
                `Total        : Rp ${vehicle.totalPrice.toLocaleString()}\n` +
                LINE_FEED +
                SEPARATOR +
                CENTER + "NB: Tidak Menerima Buah Curian !\n" +
                CENTER + "Terima Kasih!\n" +
                SEPARATOR +
                LINE_FEED.repeat(3); // Feed paper after print
    
            // 4. Encode and Send Data to Printer
            let encoder = new TextEncoder();
            let data = encoder.encode(invoiceText);
            await characteristic.writeValue(data);
    
            alert("Nota Terkirim ke Printer ✅");
        } catch (error) {
            console.error("Bluetooth Print Error: ", error);
            alert("Failed to print invoice. ❌");
        }
    };

    return (
        <div className="container mt-4">
            <h2 className="text-center mb-4">Input Data Timbangan</h2>
            <div className="row">
                <div className="col-md-4">
                    <label>No Kendaraan:</label>
                    <input type="text" className="form-control" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value.toUpperCase())} />
                </div>
                <div className="col-md-4">
                    <label>Bruto (Kg):</label>
                    <input type="number" className="form-control" value={bruto} onChange={(e) => setBruto(e.target.value)} />
                </div>
                <div className="col-md-4">
                    <label>Tar (Kg):</label>
                    <input type="number" className="form-control" value={tar} onChange={(e) => setTar(e.target.value)} />
                </div>
                <div className="col-md-4 mt-3">
                    <label>Potongan (%):</label>
                    <input type="number" className="form-control" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                </div>
                <div className="col-md-4 mt-3">
                    <label>Harga per Kg:</label>
                    <input type="number" className="form-control" value={pricePerKg} onChange={(e) => setPricePerKg(e.target.value)} />
                </div>
                <div className="col-md-4 d-grid mt-4">
                    <button className="btn btn-primary" onClick={handleSubmit}>KIRIM</button>
                </div>
            </div>
            <div className="col-md-4 d-grid mt-4">
                    <button className="btn btn-danger" onClick={handleLogout}>LOGOUT</button>
                </div>

            {/* Vehicle Table */}
            <h4 className="mt-4">Kendaraan Terdaftar</h4>
            <input
                type="text"
                className="form-control mb-3"
                placeholder="Cari Nomor Polisi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
            <div className="table-responsive">
                <table className="table table-striped">
                    <thead className="table-dark">
                        <tr>
                            <th>Tanggal</th>
                            <th>Nomor Polisi</th>
                            <th>Bruto</th>
                            <th>Tar</th>
                            <th>Netto</th>
                            <th>Potongan (%)</th>
                            <th>Harga/Kg</th>
                            <th>Netto Bersih</th>
                            <th>Total</th>
                            <th>Print</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vehicles
                            .filter(vehicle => vehicle.operator === "Pabrik") 
                            .filter(vehicle => vehicle.plateNumber.includes(search.toUpperCase()))
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

export default DashboardInput;
