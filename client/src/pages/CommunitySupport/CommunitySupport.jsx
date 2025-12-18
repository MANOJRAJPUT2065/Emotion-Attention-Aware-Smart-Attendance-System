import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import SideBar from './SideBar';
import ChatPanel from './Channels/ChatPanel';
import ChatArea from './Channels/ChatArea';
import exit from './exit.png'
import './communityPage.css';

const socket = io.connect('http://localhost:5000');

const CommunitySupport = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [activeChannel, setActiveChannel] = useState('General Support');
    const navigate = useNavigate();

    const handleLogout = useCallback(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        toast.success("Logged out due to inactivity", { autoClose: 3000 });
        navigate('/login');
    }, [navigate]);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            setIsLoggedIn(true);
            const autoLogoutTimer = setTimeout(() => {
                handleLogout();
            }, 60 * 60 * 1000);
            return () => {
                clearTimeout(autoLogoutTimer);
                socket.disconnect();
            };
        } else {
            toast.info('Please log in to access all features');
            navigate('/login');
        }
    }, [navigate, handleLogout]);

    const handleChannelChange = (channel) => {
        setActiveChannel(channel);
    };

    if (!isLoggedIn) {
        return <p>Loading...</p>;
    }

    const navigateHome = () => {
        navigate('/home');
    }

    return (
        <>
            <div className='community-navbar'>
                <button className="logout-button" onClick={navigateHome}>
                    <img src={exit} alt="" />
                    Back to home
                </button>
            </div>

            <div className="community-main-page">
                <SideBar />
                <ChatPanel onChannelChange={handleChannelChange} activeChannel={activeChannel} />
                <ChatArea socket={socket} activeChannel={activeChannel} />
            </div>
        </>
    );
};

export default CommunitySupport;
