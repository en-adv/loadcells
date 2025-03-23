import React, { useState, useEffect } from "react";
import axios from "axios";
import Chart from "react-apexcharts";
import { Typography, Card, CardContent, Grid } from "@mui/material";
const API_URL = process.env.REACT_APP_API_URL;
const Grafik = () => {
    const [priceData, setPriceData] = useState({
        categories: [],
        series: [{ name: "Harga", data: [] }]
    });

    // Fetch all price history
    const fetchData = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/price/history`);
            const formattedData = response.data.map(entry => ({
                time: new Date(entry.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                price: entry.price
            }));

            setPriceData({
                categories: formattedData.map(entry => entry.time),
                series: [{ name: "Harga", data: formattedData.map(entry => entry.price) }]
            });
        } catch (error) {
            console.error("Error fetching price history:", error);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ padding: 20 }}>
            <Typography variant="h4" gutterBottom>
                Grafik Harga Sawit
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">Perubahan Harga per Kg</Typography>
                            <Chart
                                options={{
                                    chart: { type: "line", toolbar: { show: false } },
                                    xaxis: { categories: priceData.categories, title: { text: "Waktu" } },
                                    yaxis: { title: { text: "Harga (Rp)" } },
                                    stroke: { curve: "smooth" },
                                    markers: { size: 4 }
                                }}
                                series={priceData.series}
                                type="line"
                                height={350}
                            />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </div>
    );
};

export default Grafik;
