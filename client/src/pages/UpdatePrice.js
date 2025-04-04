import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const API_URL = process.env.REACT_APP_API_URL;

const UpdatePricePage = () => {
    const token = localStorage.getItem("token");
    const decoded = token ? jwtDecode(token) : null;
    const userRole = decoded?.role;
    const isAdmin = userRole === "admin";
    const operator = userRole;

    const [price, setPrice] = useState("");
    const [latestPrices, setLatestPrices] = useState({});
    const [status, setStatus] = useState("");

    useEffect(() => {
        const fetchPrices = async () => {
            if (isAdmin) {
                const targets = ["Binanga", "Paranjulu", "Portibi"];
                const results = {};
                for (const op of targets) {
                    try {
                        const res = await axios.get(`${API_URL}/api/price/${op}`);
                        results[op] = res.data.price;
                    } catch {
                        results[op] = null;
                    }
                }
                setLatestPrices(results);
            } else {
                try {
                    const res = await axios.get(`${API_URL}/api/price/${operator}`);
                    setLatestPrices({ [operator]: res.data.price });
                } catch {
                    setLatestPrices({ [operator]: null });
                }
            }
        };

        fetchPrices();
    }, [userRole]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isAdmin) {
                const operators = ["Binanga", "Paranjulu", "Portibi"];
                await Promise.all(
                    operators.map((op) =>
                        axios.post(`${API_URL}/api/price`, {
                            operator: op,
                            price,
                            role: userRole, // Tambahkan role dalam body
                        })
                    )
                );
                setStatus("✅ Harga berhasil diperbarui untuk semua operator.");
                setLatestPrices({ Binanga: price, Paranjulu: price, Portibi: price });
            } else {
                await axios.post(`${API_URL}/api/price`, {
                    operator,
                    price,
                    role: userRole, // Tambahkan role dalam body
                });
                setStatus("✅ Harga berhasil diperbarui.");
                setLatestPrices({ [operator]: price });
            }

            setPrice("");
        } catch (err) {
            console.error(err);
            setStatus("❌ Gagal memperbarui harga.");
        }
    };

    return (
        <div className="container mt-4">
            <h3>Update Harga</h3>

            {isAdmin ? (
                <div className="mb-3">
                    <p>Harga Terakhir:</p>
                    <ul>
                        {["Binanga", "Paranjulu", "Portibi"].map(op => (
                            <li key={op}>
                                {op}: {latestPrices[op] ? `Rp ${latestPrices[op]}` : "Belum ada harga"}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <p>Harga Terakhir: {latestPrices[operator] ? `Rp ${latestPrices[operator]}` : "Belum ada harga"}</p>
            )}

            <form onSubmit={handleSubmit}>
                <input
                    type="number"
                    className="form-control"
                    placeholder="Masukkan harga baru"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                />
                <button type="submit" className="btn btn-primary mt-2">Update Harga</button>
            </form>

            {status && <p className="mt-3">{status}</p>}
        </div>
    );
};

export default UpdatePricePage;
