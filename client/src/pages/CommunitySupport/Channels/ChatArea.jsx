import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../communityPage.css';

const ChatArea = ({ socket, activeChannel }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);

    const username = localStorage.getItem('username');

    useEffect(() => {
        if (!username) {
            console.warn('No username found. Redirecting to login.');
            navigate('/login');
        }

        const fetchMessages = async () => {
            try {
                let response;
                if (activeChannel.includes('@')) {
                    response = await axios.get(`/api/direct-message/${username}/${activeChannel}`);
                } else {
                    response = await axios.get(`/api/messages/${activeChannel}`);
                }

                setMessages(response.data || []);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };

        fetchMessages();

        socket.on('message', (data) => {
            if (data.channel === activeChannel) {
                setMessages((prevMessages) => [...prevMessages, data]);
            }
        });

        return () => {
            socket.off('message');
        };
    }, [socket, activeChannel, username, navigate]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = () => {
        if (message.trim()) {
            const currentTime = new Date();
            const formattedTime = currentTime.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Asia/Kolkata',
            });

            socket.emit('message', {
                username,
                message,
                channel: activeChannel,
                time: formattedTime
            });
            setMessage('');
        }
    };

    return (
        <div className="chat-area">
            <div className="channel-details">
                {activeChannel}
            </div>
            <div className="messages">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`message ${msg.username === username ? 'current-user' : 'other-user'}`}
                    >
                        <div>
                            <strong className={`user-name ${msg.username === username ? 'current' : 'other'}`}>
                                {msg.username}
                            </strong>
                        </div>
                        <div>{msg.message}</div>
                        <span className="message-time">{msg.time}</span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="text-area">
                <input
                    type="text"
                    name="message"
                    id="message"
                    value={message}
                    placeholder='Type a message...'
                    autoComplete="off"
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <svg
                    className='send-button'
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

export default ChatArea;
