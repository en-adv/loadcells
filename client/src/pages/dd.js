import React, { useState, useEffect } from "react";
import { Typography, Card, CardContent, TextField, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, MenuItem, Grid } from "@mui/material";
import { ref, onValue } from "firebase/database";
import { database } from "../firebaseConfig";
import axios from "axios";
const API_URL = process.env.REACT_APP_API_URL;
const AdminDashboard = () => {
    const db = database;

    // State
    const [loadCell, setLoadCell] = useState(0);
    const [plateNumber, setPlateNumber] = useState("");
    const [selectedType, setSelectedType] = useState("Bruto");
    const [vehicles, setVehicles] = useState([]);
    const [search, setSearch] = useState("");
    const [pricePerKg, setPricePerKg] = useState(0);  // State for price per kg

    // Fetch Load Cell Data from Firebase
    useEffect(() => {
        const loadCellRef = ref(db, "timbangan/lokasi1/berat");
        onValue(loadCellRef, (snapshot) => {
            if (snapshot.exists()) {
                setLoadCell(snapshot.val());
            }
        });
    }, []);

    // Fetch Vehicle Data from MongoDB
    useEffect(() => {
        axios.get(`${API_URL}/api/vehicles`)
            .then((res) => setVehicles(res.data))
            .catch((err) => console.error("Error fetching vehicles:", err));
    }, []);

    // Fetch Price Data from MongoDB
    useEffect(() => {
        axios.get(`${API_URL}/api/price`)
            .then((res) => {
                if (res.data.length > 0) {
                    setPricePerKg(res.data[0].price); // Assuming the latest price is in index 0
                }
            })
            .catch((err) => console.error("Error fetching price:", err));
    }, []);

    // Submit Data to MongoDB
    const handleSubmit = () => {
        if (!plateNumber) {
            alert("Masukkan Nomor Kendaraan");
            return;
        }
    
        const payload = {
            plateNumber,
            weight: loadCell,
            type: selectedType,
            pricePerKg  // Include price in request
        };
    
        axios.post(`${API_URL}/api/vehicles`, payload)
            .then(() => {
                setPlateNumber(""); // Clear input
                axios.get(`${API_URL}/api/vehicles`).then(res => setVehicles(res.data)); // Refresh table
            })
            .catch(err => console.error("Error submitting data:", err));
    };
    

    return (
        <div style={{ padding: 20 }}>
            <Typography variant="h4" gutterBottom>
                Monitor Timbangan Sawit
            </Typography>

            {/* Grid Layout for Load Cell and Price */}
            <Grid container spacing={2}>
                {/* Load Cell Card */}
                <Grid item xs={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">Timbangan Lokasi 1</Typography>
                            <Typography variant="h4" color="primary">{loadCell} kg</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Price Card */}
                <Grid item xs={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">Harga per kg</Typography>
                            <Typography variant="h4" color="secondary">Rp {pricePerKg.toLocaleString()}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Input for Plate Number */}
            <div style={{ marginTop: 20 }}>
                <TextField
                    label="No Kendaraan"
                    variant="outlined"
                    fullWidth
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value.toUpperCase().replace(/\s/g, ""))}
                />

                {/* Dropdown for Bruto/Tar Selection */}
                <TextField
                    select
                    label="Pilih Jenis Berat"
                    variant="outlined"
                    fullWidth
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    style={{ marginTop: 10 }}
                >
                    <MenuItem value="Bruto">Bruto</MenuItem>
                    <MenuItem value="Tar">Tar</MenuItem>
                </TextField>

                <Button variant="contained" color="primary" onClick={handleSubmit} style={{ marginTop: 10 }}>
                    KIRIM
                </Button>
            </div>

            
                        {/* Editable Price Input */}
            <Typography variant="h6" style={{ marginTop: 20 }}>Update Harga per kg</Typography>
            <TextField
                variant="outlined"
                fullWidth
                value={pricePerKg}
                onChange={(e) => setPricePerKg(e.target.value)}
                type="number"
                InputProps={{ inputProps: { min: 0 } }}
                style={{ marginBottom: 10 }}
            />
            <Button 
                variant="contained" 
                color="secondary" 
                onClick={() => {
                    axios.post(`${API_URL}/api/price`, { price: pricePerKg })
                        .then(() => alert("Harga diperbarui!"))
                        .catch(err => console.error("Error updating price:", err));
                }}
            >
                Update Harga
            </Button>

            {/* Search Bar for Plate Number */}
            <TextField
                label="Cari Nomor Kendaraan"
                variant="outlined"
                fullWidth
                margin="normal"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            {/* Registered Vehicles Table */}
            <Typography variant="h5" style={{ marginTop: 20 }}>
                Kendaraan Terdaftar
            </Typography>
            <TableContainer component={Paper} style={{ marginTop: 10 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nomor Plat</TableCell>
                            <TableCell>Bruto (kg)</TableCell>
                            <TableCell>Tar (kg)</TableCell>
                            <TableCell>Netto (kg)</TableCell>
                            <TableCell>Harga (Rp)</TableCell> {/* New Column */}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                    {vehicles
    .filter(vehicle => vehicle.plateNumber?.toUpperCase().includes(search.toUpperCase()))
    .map((vehicle, index) => {
        const netto = vehicle.bruto && vehicle.tar ? vehicle.bruto - vehicle.tar : 0;
        const totalPrice = netto * pricePerKg; 

        return (
            <TableRow key={index}>
                <TableCell>{vehicle.plateNumber || "-"}</TableCell>
                <TableCell>{vehicle.bruto || "-"} Kg</TableCell>
                <TableCell>{vehicle.tar || "-"} Kg</TableCell>
                <TableCell>{netto || "-"} Kg</TableCell>
                <TableCell>Rp {totalPrice.toLocaleString()}</TableCell>
            </TableRow>
        );
    })}

                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
};

export default AdminDashboard;
