import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Login from "./components/Login";
import Layout from "./components/Layout";
import AdminDashboard from "./pages/AdminDashboard";
import OperatorDashboard1 from "./pages/OperatorDashboard1";
import OperatorDashboard2 from "./pages/OperatorDashboard2";
import OperatorDashboard3 from "./pages/OperatorDashboard3";
import OperatorDashboard4 from "./pages/OperatorDashboard4";
import OperatorDashboard5 from "./pages/OperatorDashboard5";
import PabrikDashboard from "./pages/PabrikDashboard";
import Grafik from "./pages/Grafik";
import Download from "./pages/Download";
import ChatPage from "./pages/ChatPage";
import Diskon from "./pages/OperatorDiscount";
import UpdatePrice from "./pages/UpdatePrice";
import ReadMessagesPage from "./pages/ReadMessagesPage";
import "bootstrap/dist/css/bootstrap.min.css";

const App = () => {
    const [auth, setAuth] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const expiry = localStorage.getItem("expiry");
    
        if (token && expiry) {
            const now = Date.now();
    
            if (now >= parseInt(expiry)) {
                // Token kadaluarsa, bersihkan
                localStorage.removeItem("token");
                localStorage.removeItem("role");
                localStorage.removeItem("expiry");
                setAuth(null);
            } else {
                try {
                    const decoded = jwtDecode(token);
                    setAuth(decoded.role); // Valid, simpan role
                } catch (error) {
                    // Token invalid
                    localStorage.removeItem("token");
                    localStorage.removeItem("role");
                    localStorage.removeItem("expiry");
                    setAuth(null);
                }
            }
        } else {
            setAuth(null); // Tidak ada token
        }
    }, []);
    

    return (
        <Router>
            <Routes>
                {/* 🔹 Login Page - Redirect Based on Role */}
                <Route
                    path="/"
                    element={
                        auth ? (
                            auth === "admin" ? (
                                <Navigate to="/admin" />
                            ) : auth.startsWith("operator") ? (
                                <Navigate to={`/${auth}`} />
                            ) : (
                                <Navigate to="/login" />
                            )
                        ) : (
                            <Login setAuth={setAuth} />
                        )
                    }
                />

                {/* 🔹 Admin Routes */}
                {auth === "admin" && (
                    <Route path="/admin/*" element={<Layout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="grafik" element={<Grafik />} />
                        <Route path="download" element={<Download />} />
                        <Route path="messages" element={<ChatPage />} />
                        <Route path="Readmessages" element={<ReadMessagesPage />} />
                        <Route path="update-price" element={<UpdatePrice />} />

                    </Route>
                )}

                {/* 🔹 Operator Routes (Dynamic for 5 Operators) */}
                {auth === "Sigalagala" && (
                    <Route path="/Sigalagala/*" element={<Layout />}>
                        <Route index element={<OperatorDashboard1 />} />
                        <Route path="diskon" element={<Diskon />} />
                        <Route path="readmessages" element={<ReadMessagesPage />} />
                        <Route path="update-price" element={<UpdatePrice operator="Sigalagala" />} />
                    </Route>
                )}

                {auth === "Hapung" && (
                    <Route path="/Hapung/*" element={<Layout />}>
                        <Route index element={<OperatorDashboard2 />} />
                        <Route path="diskon" element={<Diskon />} />
                        <Route path="readmessages" element={<ReadMessagesPage />} />
                        <Route path="update-price" element={<UpdatePrice operator="Hapung" />} />
                    </Route>
                )}

                {auth === "Paranjulu" && (
                    <Route path="/Paranjulu/*" element={<Layout />}>
                        <Route index element={<OperatorDashboard3 />} />
                        <Route path="diskon" element={<Diskon />} />
                        <Route path="readmessages" element={<ReadMessagesPage />} />
                    </Route>
                )}

                {auth === "Binanga" && (
                    <Route path="/Binanga/*" element={<Layout />}>
                        <Route index element={<OperatorDashboard4 />} />
                        <Route path="diskon" element={<Diskon />} />
                        <Route path="readmessages" element={<ReadMessagesPage />} />
                    </Route>
                )}

                {auth === "Portibi" && (
                    <Route path="/Portibi/*" element={<Layout />}>
                        <Route index element={<OperatorDashboard5 />} />
                        <Route path="diskon" element={<Diskon />} />
                        <Route path="readmessages" element={<ReadMessagesPage />} />
                    </Route>
                )}

                {/* 🔹 Pabrik Route */}
                {auth === "Pabrik" && (
                    <Route path="/pabrik" element={<PabrikDashboard />} /> // 🔹 Hanya akses Dashboard Pabrik
                )}
            </Routes>
        </Router>
    );
};

export default App;
