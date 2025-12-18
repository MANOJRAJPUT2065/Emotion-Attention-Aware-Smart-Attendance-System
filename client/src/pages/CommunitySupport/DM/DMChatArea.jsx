import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../communityPage.css';

const DMChatArea = ({ selectedUser }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const messagesEndRef = useRef(null);
    const currentUser = localStorage.getItem('username');

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/direct-message/${currentUser}/${selectedUser}`);
                console.log(response.data);
                setMessages(response.data?.conversation?.messages || []);
            } catch (error) {
                console.error('Error fetching messages:', error);
                setMessages([]);
            }
        };

        if (selectedUser) {
            fetchMessages();
        }
    }, [currentUser, selectedUser]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const sendMessage = async () => {
        if (message.trim()) {
            try {
                await axios.post(`http://localhost:5000/api/direct-message/${currentUser}/${selectedUser}`, {
                    sender: currentUser,
                    receiver: selectedUser,
                    message,
                });
                setMessages((prevMessages) => [...prevMessages, { sender: currentUser, message, timestamp: new Date() }]);
                setMessage('');
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    };

    const formatTimestampToIST = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div className="chat-area">
            <div className="channel-details">
                {selectedUser ? `Chat with ${selectedUser}` : 'Select a user to chat'}
            </div>
            <div className="messages">
                {messages.length > 0 ? (
                    messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`message ${msg.sender === currentUser ? 'current-user' : 'other-user'}`}
                        >
                            <strong className={`user-name ${msg.sender === currentUser ? 'current' : 'other'}`}>
                                {msg.sender}
                            </strong>
                            <div>{msg.message}</div>
                            <div className="message-time">
                                {formatTimestampToIST(msg.timestamp)}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-messages">No messages yet</div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="text-area">
                <input
                    type="text"
                    name="message"
                    id="message"
                    value={message}
                    placeholder="Type a message..."
                    autoComplete="off"
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <svg
                    className="send-button"
                    viewBox="0 0 25 25"
                    height="25"
                    width="25"
                    preserveAspectRatio="xMidYMid meet"
                    version="1.1"
                    x="0px"
                    y="0px"
                    enableBackground="new 0 0 25 25"
                    onClick={sendMessage}
                >
                    <title>send-message</title>
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        fill="currentColor"
                        d="M14.248,6.973c0-0.614,0.741-0.921,1.174-0.488l5.131,5.136 c0.269,0.269,0.269,0.704,0,0.973l-5.131,5.136c-0.433,0.433-1.174,0.126-1.174-0.488v-2.319c-4.326,0-7.495,1.235-9.85,3.914 c-0.209,0.237-0.596,0.036-0.511-0.268c1.215-4.391,4.181-8.492,10.361-9.376V6.973z"
                    />
                </svg>
            </div>
        </div>
    );
};

export default DMChatArea;
