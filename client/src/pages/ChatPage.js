import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment";

const API_URL = process.env.REACT_APP_API_URL;

const ChatPage = () => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");

    useEffect(() => {
        axios.get(`${API_URL}/api/messages`)
            .then(res => setMessages(res.data))
            .catch(err => console.error("Error fetching messages:", err));
    }, []);

    const sendMessage = () => {
        if (!newMessage.trim()) return;
        axios.post(`${API_URL}/api/messages`, { text: newMessage })
            .then(res => {
                setMessages([res.data, ...messages]);
                setNewMessage("");
            })
            .catch(err => console.error("Error sending message:", err));
    };

    return (
        <div className="container mt-4">
            <h2 className="text-center">Chat Room</h2>
            <div className="card">
                <div className="card-body" style={{ maxHeight: "400px", overflowY: "auto" }}>
                    {messages.map((msg, index) => (
                        <div key={index} className="p-2 mb-2 border rounded">
                            <small className="text-muted">{moment(msg.createdAt).format("HH:mm")}</small>
                            <div>{msg.text}</div>
                        </div>
                    ))}
                </div>
                <div className="input-group mt-3">
                    <input
                        type="text"
                        className="form-control"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                    />
                    <button className="btn btn-primary" onClick={sendMessage}>Send</button>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
