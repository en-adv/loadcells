import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Container, TextField, Button, Typography, Card, CardContent, Box } from "@mui/material";

const API_URL = process.env.REACT_APP_API_URL;

const Login = ({ setAuth }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    
    const handleLogin = async () => {
        try {
            const res = await axios.post(`${API_URL}/api/auth/login`, { username, password });
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("role", res.data.role);
            
            // Tambahkan waktu expired (misalnya 1 jam dari sekarang)
            const expiry = Date.now() + 60 * 60 * 1000;
            localStorage.setItem("expiry", expiry);
    
            setAuth(res.data.role);
    
            // Redirect sesuai role
            switch (res.data.role) {
                case "admin":
                    navigate("/admin");
                    break;
                case "Sigalagala":
                    navigate("/Sigalagala");
                    break;
                case "Hapung":
                    navigate("/Hapung");
                    break;
                case "Paranjulu":
                    navigate("/Paranjulu");
                    break;
                case "Binanga":
                    navigate("/Binanga");
                    break;
                case "Portibi":
                    navigate("/Portibi");
                    break;
                case "Pabrik":
                    navigate("/pabrik");
                    break;
                default:
                    navigate("/login");
            }
        } catch (err) {
            setError("Invalid Credentials");
        }
    };
    

    return (
        <Container maxWidth="sm">
            <Box sx={{ display: "flex", justifyContent: "center", height: "100vh", alignItems: "center" }}>
                <Card sx={{ padding: 3, width: "100%", maxWidth: 400, boxShadow: 3 }}>
                    <CardContent>
                        <Typography variant="h5" align="center" gutterBottom>
                            Sawit Makmur
                        </Typography>
                        <TextField
                            fullWidth
                            label="Username"
                            variant="outlined"
                            margin="normal"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <TextField
                            fullWidth
                            label="Password"
                            variant="outlined"
                            type="password"
                            margin="normal"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        {error && (
                            <Typography color="error" variant="body2" align="center">
                                {error}
                            </Typography>
                        )}
                        <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            sx={{ marginTop: 2 }}
                            onClick={handleLogin}
                        >
                            Login
                        </Button>
                    </CardContent>
                </Card>
            </Box>
        </Container>
    );
};

export default Login;
