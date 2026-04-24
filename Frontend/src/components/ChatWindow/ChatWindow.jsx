import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './ChatWindow.css';

// Conectamos al backend (Asegúrate de que el puerto coincida con tu servidor)
const socket = io('http://localhost:5000');

const ChatWindow = ({ serviceId, userId, userName, onClose }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const chatEndRef = useRef(null);

    useEffect(() => {
        // Unirse a la sala específica de este servicio técnico
        socket.emit('join_chat', serviceId);

        // Escuchar mensajes entrantes
        socket.on('receive_message', (data) => {
            setMessages((prev) => [...prev, data]);
        });

        // Limpiar al desmontar el componente
        return () => {
            socket.off('receive_message');
        };
    }, [serviceId]);

    // Auto-scroll al último mensaje
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (message.trim()) {
            const msgData = {
                serviceId,
                senderId: userId,
                senderName: userName,
                text: message,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            socket.emit('send_message', msgData);
            setMessage('');
        }
    };

    return (
        <div className="chat-window-container">
            <div className="chat-header">
                <div className="chat-user-info">
                    <div className="chat-status-dot"></div>
                    <span>Chat de Soporte Técnico</span>
                </div>
                <button className="chat-close-btn" onClick={onClose}>✕</button>
            </div>

            <div className="chat-messages-area">
                {messages.length === 0 && (
                    <div className="chat-empty-state">
                        Comienza la conversación con tu mecánico...
                    </div>
                )}
                {messages.map((m, i) => (
                    <div 
                        key={i} 
                        className={`message-wrapper ${m.senderId === userId ? 'sent' : 'received'}`}
                    >
                        <div className="message-bubble">
                            {m.senderId !== userId && <small className="sender-name">{m.senderName}</small>}
                            <p className="message-text">{m.text}</p>
                            <span className="message-time">{m.time}</span>
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={sendMessage}>
                <input 
                    type="text"
                    value={message} 
                    onChange={(e) => setMessage(e.target.value)} 
                    placeholder="Escribe un mensaje..."
                />
                <button type="submit" className="chat-send-btn">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;
