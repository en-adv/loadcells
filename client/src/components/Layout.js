import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Box } from "@mui/material";

const Layout = () => {
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    return (
        <Box sx={{ display: "flex" }}>
            <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />
            
            {/* Page Content */}
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Outlet /> {/* ✅ This will load AdminDashboard or other pages */}
            </Box>
        </Box>
    );
};

export default Layout;
