import React, { useEffect, useRef } from 'react';
import './ChatWindow.css';

/**
 * ChatWindow — componente de presentación puro.
 *
 * NO maneja estado de mensajes ni socket internamente.
 * Ambos viven en el dashboard padre, por lo que sobreviven
 * al cierre y reapertura del chat.
 *
 * Props:
 *  - messages      : array de mensajes (estado del padre)
 *  - message       : texto del input (estado del padre)
 *  - onMessageChange : setter del input
 *  - onSend        : función que ejecuta el envío
 *  - userId        : id del usuario actual (para diferenciar sent/received)
 *  - onClose       : función para cerrar el chat
 */
const ChatWindow = ({ messages, message, onMessageChange, onSend, userId, onClose }) => {
    const chatEndRef = useRef(null);

    // Auto-scroll cada vez que llega un nuevo mensaje
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSend();
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
                        key={m.id || i}
                        className={`message-wrapper ${
                            (m.senderId ?? m.emisor_id) === userId ? 'sent' : 'received'
                        }`}
                    >
                        <div className="message-bubble">
                            {(m.senderId ?? m.emisor_id) !== userId && (
                                <small className="sender-name">
                                    {m.senderName ?? m.emisor_nombre}
                                </small>
                            )}
                            <p className="message-text">{m.text ?? m.texto}</p>
                            <span className="message-time">{m.time}</span>
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={message}
                    onChange={(e) => onMessageChange(e.target.value)}
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
