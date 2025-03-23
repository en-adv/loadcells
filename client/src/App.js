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
import Grafik from "./pages/Grafik";
import Download from "./pages/Download";
import ChatPage from "./pages/ChatPage";
import Diskon from "./pages/OperatorDiscount";
import ReadMessagesPage from "./pages/ReadMessagesPage";
import "bootstrap/dist/css/bootstrap.min.css";

const App = () => {
    const [auth, setAuth] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setAuth(decoded.role); // ✅ Store the role from JWT
            } catch (error) {
                setAuth(null);
            }
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

                    </Route>
                )}

                {/* 🔹 Operator Routes (Dynamic for 5 Operators) */}
                {auth === "operator1" && (
                    <Route path="/operator1/*" element={<Layout />}>
                        <Route index element={<OperatorDashboard1 />} />
                        <Route path="diskon" element={<Diskon />} />
                        <Route path="readmessages" element={<ReadMessagesPage />} />
                    </Route>
                )}

                {auth === "operator2" && (
                    <Route path="/operator2/*" element={<Layout />}>
                        <Route index element={<OperatorDashboard2 />} />
                        <Route path="diskon" element={<Diskon />} />
                        <Route path="readmessages" element={<ReadMessagesPage />} />
                    </Route>
                )}

                {auth === "operator3" && (
                    <Route path="/operator3/*" element={<Layout />}>
                        <Route index element={<OperatorDashboard3 />} />
                        <Route path="diskon" element={<Diskon />} />
                        <Route path="readmessages" element={<ReadMessagesPage />} />
                    </Route>
                )}

                {auth === "operator4" && (
                    <Route path="/operator4/*" element={<Layout />}>
                        <Route index element={<OperatorDashboard4 />} />
                        <Route path="diskon" element={<Diskon />} />
                        <Route path="readmessages" element={<ReadMessagesPage />} />
                    </Route>
                )}

                {auth === "operator5" && (
                    <Route path="/operator5/*" element={<Layout />}>
                        <Route index element={<OperatorDashboard5 />} />
                        <Route path="diskon" element={<Diskon />} />
                        <Route path="readmessages" element={<ReadMessagesPage />} />
                    </Route>
                )}
            </Routes>
        </Router>
    );
};

export default App;
