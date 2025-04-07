import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

const API_URL = process.env.REACT_APP_API_URL;

const DashboardInputPS = () => {
    const [plateNumber, setPlateNumber] = useState("");
    const [bruto, setBruto] = useState("");
    const [tar, setTar] = useState("");
    const [nettoGross, setNettoGross] = useState("");
    const [discount, setDiscount] = useState("");
    const [nettoBersih, setNettoBersih] = useState("");
    const [pricePerKg, setPricePerKg] = useState("");
    const [bongkar, setBongkar] = useState("");
    const [muat, setMuat] = useState("");
    const [pph, setPph] = useState("");
    const [total, setTotal] = useState("");
    const [entries, setEntries] = useState([]);

    useEffect(() => {
        axios.get(`${API_URL}/api/ps`)
            .then((res) => setEntries(res.data))
            .catch((err) => console.error("Error fetching data:", err));
    }, []);

    // Hitung nilai yang tergantung input
    useEffect(() => {
        const brutoNum = Number(bruto);
        const tarNum = Number(tar);
        const nettoGrossCalc = brutoNum && tarNum ? brutoNum - tarNum : 0;
        setNettoGross(nettoGrossCalc);

        const nettoBersihCalc = nettoGrossCalc - Number(discount || 0);
        setNettoBersih(nettoBersihCalc);

        const totalCalc = (nettoBersihCalc * Number(pricePerKg || 0)) -
            (Number(bongkar || 0) * 16) -
            (Number(muat || 0) * 8) -
            Number(pph || 0);

        setTotal(totalCalc >= 0 ? totalCalc : 0);
    }, [bruto, tar, discount, pricePerKg, bongkar, muat, pph]);

    const handleSubmit = () => {
        if (!plateNumber || !bruto || !tar || !pricePerKg) {
            alert("Semua field wajib diisi!");
            return;
        }

        const payload = {
            plateNumber,
            bruto: Number(bruto),
            tar: Number(tar),
            nettoGross,
            discount: Number(discount || 0),
            nettoBersih,
            pricePerKg: Number(pricePerKg),
            bongkar: Number(bongkar || 0),
            muat: Number(muat || 0),
            pph: Number(pph || 0),
            total,
            date: new Date()
        };

        axios.post(`${API_URL}/api/ps`, payload)
            .then(() => {
                setPlateNumber(""); setBruto(""); setTar(""); setDiscount("");
                setPricePerKg(""); setBongkar(""); setMuat(""); setPph("");
                setNettoGross(""); setNettoBersih(""); setTotal("");

                // Refresh data
                axios.get(`${API_URL}/api/ps`).then(res => setEntries(res.data));
            })
            .catch(err => console.error("Error submitting data:", err));
    };

    return (
        <div className="container mt-4">
            <h2 className="text-center mb-4">Input Data SP</h2>
            <div className="row g-3">
                <div className="col-md-4">
                    <label>No Polisi:</label>
                    <input className="form-control" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value.toUpperCase())} />
                </div>
                <div className="col-md-4">
                    <label>Bruto (Kg):</label>
                    <input type="number" className="form-control" value={bruto} onChange={(e) => setBruto(e.target.value)} />
                </div>
                <div className="col-md-4">
                    <label>Tarre (Kg):</label>
                    <input type="number" className="form-control" value={tar} onChange={(e) => setTar(e.target.value)} />
                </div>
                <div className="col-md-4">
                    <label>Netto Gross (Kg):</label>
                    <input className="form-control" value={nettoGross} disabled />
                </div>
                <div className="col-md-4">
                    <label>Potongan (Kg):</label>
                    <input type="number" className="form-control" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                </div>
                <div className="col-md-4">
                    <label>Netto Bersih (Kg):</label>
                    <input className="form-control" value={nettoBersih} disabled />
                </div>
                <div className="col-md-4">
                    <label>Harga (Rp):</label>
                    <input type="number" className="form-control" value={pricePerKg} onChange={(e) => setPricePerKg(e.target.value)} />
                </div>
                <div className="col-md-4">
                    <label>Bongkar (Kg):</label>
                    <input type="number" className="form-control" value={bongkar} onChange={(e) => setBongkar(e.target.value)} />
                </div>
                <div className="col-md-4">
                    <label>Muat (Kg):</label>
                    <input type="number" className="form-control" value={muat} onChange={(e) => setMuat(e.target.value)} />
                </div>
                <div className="col-md-4">
                    <label>( *):</label>
                    <input type="number" className="form-control" value={pph} onChange={(e) => setPph(e.target.value)} />
                </div>
                <div className="col-md-4">
                    <label>Total (Rp):</label>
                    <input className="form-control" value={total.toLocaleString()} disabled />
                </div>
                <div className="col-md-4 d-grid">
                    <button className="btn btn-primary mt-4" onClick={handleSubmit}>SIMPAN</button>
                </div>
            </div>

            {/* Tabel Data */}
            <h4 className="mt-5">Data SP</h4>
            <div className="table-responsive">
                <table className="table table-striped">
                    <thead className="table-dark">
                        <tr>
                            <th>Tanggal</th>
                            <th>No Polisi</th>
                            <th>Bruto</th>
                            <th>Tarre</th>
                            <th>Netto Gross</th>
                            <th>Potongan</th>
                            <th>Netto Bersih</th>
                            <th>Harga</th>
                            <th>Bongkar</th>
                            <th>Muat</th>
                            <th>( *)</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((item, idx) => (
                            <tr key={idx}>
                                <td>{new Date(item.date).toLocaleString("id-ID")}</td>
                                <td>{item.plateNumber}</td>
                                <td>{item.bruto} Kg</td>
                                <td>{item.tar} Kg</td>
                                <td>{item.nettoGross} Kg</td>
                                <td>{item.discount} Kg</td>
                                <td>{item.nettoBersih} Kg</td>
                                <td>Rp {item.pricePerKg.toLocaleString()}</td>
                                <td>{item.bongkar} Kg</td>
                                <td>{item.muat} Kg</td>
                                <td>Rp {item.pph.toLocaleString()}</td>
                                <td>Rp {item.total.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DashboardInputPS;
