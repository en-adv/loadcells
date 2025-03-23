import React, { useState, useEffect } from "react";
import { Button, Typography } from "@mui/material";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const Download = () => {
    const [tableData, setTableData] = useState([]);

    // Fetch table data from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/vehicles"); // Adjust API if needed
                const filteredData = response.data.map(({ _id, __v, ...rest }) => rest); // Remove _id and __v
                setTableData(filteredData);
            } catch (error) {
                console.error("Error fetching table data:", error);
            }
        };

        fetchData();
    }, []);

    // Function to export table data to Excel
    const exportToExcel = () => {
        if (tableData.length === 0) {
            alert("No data available to export!");
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(tableData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Vehicle Data");

        // Convert workbook to a file and trigger download
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(data, "Vehicle_Data.xlsx");
    };

    return (
        <div style={{ padding: 20 }}>
            <Typography variant="h5" gutterBottom>
                Download Table Data
            </Typography>
            <Button variant="contained" color="primary" onClick={exportToExcel}>
                Download Excel
            </Button>
        </div>
    );
};

export default Download;
