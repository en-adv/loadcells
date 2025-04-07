import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Divider,
    IconButton, Button, useMediaQuery, Box
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BarChartIcon from "@mui/icons-material/BarChart";
import ChatIcon from "@mui/icons-material/Chat";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import { jwtDecode } from "jwt-decode";

const drawerWidth = 250;

const Sidebar = ({ mobileOpen, handleDrawerToggle }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isMobile = useMediaQuery("(max-width: 768px)");
    const [username, setUsername] = useState("");
    const [role, setRole] = useState("");

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
            { text: "Download", icon: <CloudDownloadIcon />, route: "/admin/download" },
            { text: "Ganti Harga", icon: <BarChartIcon />, route: "/admin/update-price" },
            { text: "Pesan", icon: <ChatIcon />, route: "/admin/messages" }
        ];
    } else if (isPabrik) {
        menuItems = [
            { text: "Dashboard Input", icon: <DashboardIcon />, route: "/pabrik" }
        ];
    }

    const drawerContent = (
        <div>
            <Toolbar>
                <h5 style={{ color: "#2D336B", margin: "center", fontFamily: "Kanit, sans-serif", fontWeight: "bolder", fontSize: "22px" }}>
                    PT. SAWIT MAKMUR
                </h5>
            </Toolbar>
            <Divider />
            <List>
                {menuItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.route);
                    return (
                        <ListItem
                            button
                            key={item.text}
                            onClick={() => navigate(item.route)}
                            sx={{
                                backgroundColor: isActive ? "#A9B5DF" : "transparent",
                                "&:hover": { backgroundColor: "#7886C7" },
                            }}
                        >
                            <ListItemIcon sx={{ color: "#2D336B" }}>{item.icon}</ListItemIcon>
                            <ListItemText
                                primary={item.text}
                                primaryTypographyProps={{
                                    style: {
                                        color: "#2D336B",
                                        fontFamily: "Kanit, sans-serif",
                                        fontWeight: "normal"
                                    }
                                }}
                            />
                        </ListItem>
                    );
                })}
            </List>

            {/* Logout Button */}
            <Box sx={{ position: "absolute", bottom: 20, left: 20, right: 20 }}>
                <Button
                    variant="contained"
                    fullWidth
                    sx={{
                        backgroundColor: "#2D336B",
                        "&:hover": { backgroundColor: "#7886C7" },
                    }}
                    onClick={handleLogout}
                    startIcon={<ExitToAppIcon />}
                >
                    Logout
                </Button>
            </Box>
        </div>
    );

    return (
        <>
            {isMobile && (
                <IconButton
                    sx={{ position: "absolute", top: 10, left: 10, color: "#2D336B", zIndex: 1300 }}
                    onClick={handleDrawerToggle}
                >
                    <MenuIcon />
                </IconButton>
            )}
            
            <Drawer
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
                    },
                }}
            >
                {drawerContent}
            </Drawer>
        </>
    );
};

export default Sidebar;
