import React from 'react'
import { useNavigate } from 'react-router-dom'
import './Header.css'
import Logout from '../../pages/AuthPages/Logout';

const Header = () => {
    const navigate = useNavigate();

    const isLoggedIn = () => {
        return localStorage.getItem('authToken') !== null;
    };

    const handleChannelNavigate = () => {
        navigate('/community')
    }
    const handleAssistNavigate = () => {
        navigate('/assist')
    }
    const handleHomeNavigate = () => {
        navigate('/')
    }

    return (
        <>
            <div className='header-layout'>
                <div className="home-logo">
                    Reconnect.
                </div>
                {isLoggedIn() ? (
                    <div className="home-nav-links">
                        <p onClick={handleHomeNavigate}>Home</p>
                        <p onClick={handleAssistNavigate}>ZenAI</p>
                        <p onClick={handleChannelNavigate}>Community</p>
                        <Logout />
                    </div>
                ) : (

                    <div>
                        <p
                            className="navLink"
                            onClick={() => navigate("/register")}
                        >
                            Register
                        </p>
                        <p
                            className="navLink"
                            onClick={() => navigate("/login")}
                        >
                            Login
                        </p>
                    </div>
                )}
            </div>
        </>
    )
}

export default Header
