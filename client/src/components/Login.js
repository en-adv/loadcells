import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
    Container, 
    TextField, 
    Button, 
    Typography, 
    Card, 
    CardContent, 
    Box,
    InputAdornment,
    IconButton,
    Alert,
    CircularProgress
} from "@mui/material";
import { 
    Visibility, 
    VisibilityOff, 
    AccountCircle, 
    Lock 
} from '@mui/icons-material';
import { checkSession, updateLastActivity, clearSession } from '../utils/sessionManager';

const API_URL = process.env.REACT_APP_API_URL;

const Login = ({ setAuth }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loginAttempts, setLoginAttempts] = useState(0);
    const MAX_LOGIN_ATTEMPTS = 5;
    const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const sanitizeInput = (input) => {
        return input.trim().replace(/[<>]/g, '');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        
        if (!username.trim() || !password.trim()) {
            setError("Username dan password harus diisi");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const response = await axios.post(`${API_URL}/api/auth/login`, {
                username: username.trim(),
                password: password.trim()
            });

            if (response.data && response.data.token) {
                localStorage.setItem("token", response.data.token);
                localStorage.setItem("role", response.data.role);
                
                const expiry = Date.now() + 8 * 60 * 60 * 1000; // 8 hours
                localStorage.setItem("expiry", expiry.toString());
                localStorage.setItem("lastActivity", Date.now().toString());
        
                setAuth(response.data.role);
        
                validateAndNavigate(response.data.role);
            } else {
                setError("Respons server tidak valid");
            }
        } catch (err) {
            console.error("Login error:", err);
            if (err.response) {
                setError(err.response.data?.message || "Username atau password salah");
            } else if (err.request) {
                setError("Tidak dapat terhubung ke server. Periksa koneksi Anda.");
            } else {
                setError("Terjadi kesalahan. Silakan coba lagi.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !isLoading) {
            handleLogin(e);
        }
    };

    const validateAndNavigate = (role) => {
        const validRoles = ["admin", "Sigalagala", "Hapung", "Paranjulu", "Binanga", "Portibi", "Pabrik"];
        
        if (!validRoles.includes(role)) {
            setError("Invalid role assignment");
            return;
        }

        const roleRouteMap = {
            admin: "/admin",
            Sigalagala: "/Sigalagala",
            Hapung: "/Hapung",
            Paranjulu: "/Paranjulu",
            Binanga: "/Binanga",
            Portibi: "/Portibi",
            Pabrik: "/pabrik"  // Note: this is lowercase as per your switch case
        };

        if (roleRouteMap[role]) {
            navigate(roleRouteMap[role], { 
                replace: true,
                state: { authenticated: true }
            });
        } else {
            navigate("/login");
        }
    };

    // Add event listener for browser back button
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isLoading) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isLoading]);

    return (
        <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
            <Box 
                component="form" 
                onSubmit={handleLogin}
                sx={{ 
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}
            >
                <Card 
                    sx={{ 
                        width: '100%',
                        maxWidth: 400,
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                        borderRadius: '20px',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        transition: 'transform 0.2s ease-in-out',
                        '&:hover': {
                            transform: 'scale(1.02)'
                        }
                    }}
                >
                    <CardContent sx={{ p: 4 }}>
                        <Box sx={{ mb: 3, textAlign: 'center' }}>
                            <Typography 
                                variant="h4" 
                                component="h1" 
                                sx={{ 
                                    fontWeight: 700,
                                    color: '#1a237e',
                                    mb: 1
                                }}
                            >
                                Sawit Makmur
                            </Typography>
                            <Typography 
                                variant="subtitle1" 
                                sx={{ 
                                    color: 'text.secondary',
                                    mb: 3
                                }}
                            >
                                Silakan masuk ke akun Anda
                            </Typography>
                        </Box>

                        {error && (
                            <Alert 
                                severity="error" 
                                sx={{ mb: 2, borderRadius: 2 }}
                            >
                                {error}
                            </Alert>
                        )}

                        <TextField
                            fullWidth
                            label="Username"
                            variant="outlined"
                            margin="normal"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isLoading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <AccountCircle color="primary" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                }
                            }}
                        />

                        <TextField
                            fullWidth
                            label="Password"
                            variant="outlined"
                            type={showPassword ? "text" : "password"}
                            margin="normal"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isLoading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Lock color="primary" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                }
                            }}
                        />

                        <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            size="large"
                            onClick={handleLogin}
                            disabled={isLoading}
                            sx={{ 
                                mt: 3,
                                mb: 2,
                                borderRadius: 2,
                                height: 48,
                                textTransform: 'none',
                                fontSize: '1rem',
                                fontWeight: 600,
                                boxShadow: '0 4px 12px rgba(55, 125, 255, 0.25)',
                                '&:hover': {
                                    boxShadow: '0 6px 16px rgba(55, 125, 255, 0.35)',
                                }
                            }}
                        >
                            {isLoading ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                'Masuk'
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </Box>
        </Container>
    );
};

export default Login;
