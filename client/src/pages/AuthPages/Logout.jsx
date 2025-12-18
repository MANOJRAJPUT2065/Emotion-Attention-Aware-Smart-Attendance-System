import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Logout = () => {
    const navigate = useNavigate();

    const clearCookies = () => {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');

        clearCookies();

        toast.success("Logged out successfully!", {
            autoClose: 3000,
        });

        navigate('/home');
    };

    return (
        <div>
            <p onClick={handleLogout}>
                Logout
            </p>
        </div>
    );
};

export default Logout;
