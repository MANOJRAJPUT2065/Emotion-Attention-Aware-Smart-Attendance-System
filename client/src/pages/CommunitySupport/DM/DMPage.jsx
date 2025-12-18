import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import SideBar from '../SideBar';

import '../communityPage.css';
import DMPanel from './DMPanel';
import DMChatArea from './DMChatArea';

const socket = io.connect('http://localhost:5000');

const DMPage = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();
    const [selectedUser, setSelectedUser] = useState(null);

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



    if (!isLoggedIn) {
        return <p>Loading...</p>;
    }



    const handleUserSelect = (user) => {
        setSelectedUser(user);
    };

    return (
        <div className="community-main-page">
            <SideBar />
            <DMPanel onUserSelect={handleUserSelect} activeUser={selectedUser} />
            <DMChatArea selectedUser={selectedUser} />
        </div>
    );
};

export default DMPage;
