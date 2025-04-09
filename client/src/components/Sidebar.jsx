import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Divider,
    IconButton, Button, useMediaQuery, Box, Typography, Chip
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BarChartIcon from "@mui/icons-material/BarChart";
import ChatIcon from "@mui/icons-material/Chat";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import { jwtDecode } from "jwt-decode";
import { ref, onValue, off } from "firebase/database";
import { database } from "../firebaseConfig";

const drawerWidth = 250;

const Sidebar = ({ mobileOpen, handleDrawerToggle }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isMobile = useMediaQuery("(max-width: 768px)");
    const [username, setUsername] = useState("");
    const [role, setRole] = useState("");
    const [firebaseConnected, setFirebaseConnected] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUsername(decoded.username);
                setRole(decoded.role); 
            } catch (error) {
                setUsername("");
                setRole("");
            }
        }
    }, []);

    useEffect(() => {
        const connectedRef = ref(database, ".info/connected");
        const connectedListener = onValue(connectedRef, (snap) => {
            setFirebaseConnected(snap.val() === true);
        });

        return () => {
            off(connectedRef);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.href = "/";
    };

    const isOperator = ["Sigalagala", "Hapung", "Paranjulu", "Binanga", "Portibi"].includes(role);
    const isPabrik = role === "Pabrik";

    let menuItems = [];

    if (isOperator) {
        menuItems = [
            { text: "Dashboard", icon: <DashboardIcon />, route: `/${role}` },
            { text: "Ganti Potongan Harga", icon: <BarChartIcon />, route: `/${role}/diskon` },
            { text: "Pesan", icon: <ChatIcon />, route: `/${role}/readmessages` },
            { text: "Ganti Harga", icon: <BarChartIcon />, route: `/${role}/update-price` }
        ];
    } else if (role === "admin") {
        menuItems = [
            { text: "Dashboard", icon: <DashboardIcon />, route: "/admin" },
            { text: "SP Summary", icon: <BarChartIcon />, route: "/admin/sp-summary" },
            { text: "Pesan", icon: <ChatIcon />, route: "/admin/messages" }
        ];
    } else if (isPabrik) {
        menuItems = [
            { text: "Dashboard Input", icon: <DashboardIcon />, route: "/pabrik" }
        ];
    }

    const drawerContent = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Toolbar sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                minHeight: '80px !important'
            }}>
                <Typography
                    variant="h6"
                    sx={{
                        color: "#2D336B",
                        fontFamily: "Kanit, sans-serif",
                        fontWeight: "bolder",
                        fontSize: "22px",
                        textAlign: "center"
                    }}
                >
                    PT. SAWIT MAKMUR
                </Typography>
            </Toolbar>
            <Divider sx={{ borderColor: '#2D336B', opacity: 0.2 }} />
            <List sx={{ flex: 1, py: 2 }}>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.route;
                    return (
                        <ListItem
                            button
                            key={item.text}
                            onClick={() => navigate(item.route)}
                            sx={{
                                backgroundColor: isActive ? "#A9B5DF" : "transparent",
                                "&:hover": { 
                                    backgroundColor: "#7886C7",
                                    transform: 'translateX(5px)',
                                    transition: 'all 0.2s ease-in-out'
                                },
                                mb: 1,
                                borderRadius: '8px',
                                mx: 1
                            }}
                        >
                            <ListItemIcon sx={{ 
                                color: "#2D336B",
                                minWidth: '40px'
                            }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.text}
                                primaryTypographyProps={{
                                    style: {
                                        color: "#2D336B",
                                        fontFamily: "Kanit, sans-serif",
                                        fontWeight: isActive ? "bold" : "normal"
                                    }
                                }}
                            />
                        </ListItem>
                    );
                })}
            </List>

            {/* Firebase Connection Status */}
            <Box sx={{ p: 2, mt: 'auto' }}>
                <Chip
                    label={firebaseConnected ? "Firebase Connected" : "Firebase Disconnected"}
                    color={firebaseConnected ? "success" : "error"}
                    sx={{
                        width: '100%',
                        mb: 2,
                        '& .MuiChip-label': {
                            fontWeight: 'bold'
                        }
                    }}
                />
                <Button
                    variant="contained"
                    fullWidth
                    sx={{
                        backgroundColor: "#2D336B",
                        "&:hover": { 
                            backgroundColor: "#7886C7",
                            transform: 'translateY(-2px)',
                            transition: 'all 0.2s ease-in-out'
                        },
                        py: 1.5,
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    onClick={handleLogout}
                    startIcon={<ExitToAppIcon />}
                >
                    Logout
                </Button>
            </Box>
        </Box>
    );

    return (
        <>
            {isMobile && (
                <IconButton
                    aria-label="toggle menu"
                    aria-expanded={mobileOpen}
                    aria-controls="sidebar-drawer"
                    sx={{ 
                        position: "fixed", 
                        top: 16, 
                        left: mobileOpen ? drawerWidth + 16 : 16, 
                        color: "#2D336B", 
                        zIndex: 1400,
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        width: 48,
                        height: 48,
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 1)',
                            transform: 'scale(1.05)',
                            boxShadow: '0 4px 12px rgba(45, 51, 107, 0.15)'
                        },
                        '&:focus': {
                            outline: '2px solid #2D336B',
                            outlineOffset: '2px',
                            backgroundColor: 'rgba(255, 255, 255, 1)'
                        },
                        '&:active': {
                            transform: 'scale(0.95)',
                            boxShadow: '0 2px 6px rgba(45, 51, 107, 0.1)'
                        },
                        boxShadow: '0 2px 8px rgba(45, 51, 107, 0.1)',
                        borderRadius: '14px',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '& .MuiSvgIcon-root': {
                            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            transform: mobileOpen ? 'rotate(90deg)' : 'rotate(0deg)'
                        }
                    }}
                    onClick={handleDrawerToggle}
                >
                    <MenuIcon />
                </IconButton>
            )}
            
            <Drawer
                id="sidebar-drawer"
                variant={isMobile ? "temporary" : "permanent"}
                open={mobileOpen}
                onClose={handleDrawerToggle}
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    "& .MuiDrawer-paper": {
                        width: drawerWidth,
                        boxSizing: "border-box",
                        bgcolor: "#e4e3f0",
                        color: "#2D336B",
                        boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
                        borderRight: 'none',
                        zIndex: 1300
                    },
                }}
            >
                {drawerContent}
            </Drawer>
        </>
    );
};

export default Sidebar;
