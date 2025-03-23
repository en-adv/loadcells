import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment";
import { useNavigate } from "react-router-dom"; // For navigation

const API_URL = process.env.REACT_APP_API_URL;

const ReadMessagesPage = () => {
    const [messages, setMessages] = useState([]);
    const navigate = useNavigate(); // For back navigation

    useEffect(() => {
        axios.get(`${API_URL}/api/messages`)
            .then(res => setMessages(res.data))
            .catch(err => console.error("Error fetching messages:", err));
    }, []);

    return (
        <div className="container mt-4">
            <h2 className="text-center">Messages</h2>
            <div className="card">
                <div className="card-body" style={{ maxHeight: "400px", overflowY: "auto" }}>
                    {messages.map((msg, index) => (
                        <div key={index} className="p-2 mb-2 border rounded">
                            <small className="text-muted">{moment(msg.createdAt).format("HH:mm")}</small>
                            <div>{msg.text}</div>
                        </div>
                    ))}
                </div>
            </div>
            <button className="btn btn-secondary mt-3" onClick={() => navigate(-1)}>Back</button>
        </div>
    );
};

export default ReadMessagesPage;
