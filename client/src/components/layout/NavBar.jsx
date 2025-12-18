import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NavBar.css';


const NavBar = () => {
    const navigate = useNavigate();

    const isLoggedIn = () => {
        return localStorage.getItem('authToken') !== null;
    };

    const handleHomeNavigate = () => {
        navigate('/');
    };

    const handleAssistNavigate = () => {
        navigate('/assist');
    };

    const handleCommunityNavigate = () => {
        navigate('/community');
    };

    return (
        <div className='navBar'>
            <div className="navLink" onClick={handleHomeNavigate}>Home</div>

            {isLoggedIn() ? (
                <>
                    <div className="navLink" onClick={handleAssistNavigate}>ZenAI</div>
                    <div className="navLink" onClick={handleCommunityNavigate}>Community</div>
                </>
            ) : (
                <>
                    <div
                        className="navLink"
                        onClick={() => navigate("/register")}
                    >
                        Register
                    </div>
                    <div
                        className="navLink"
                        onClick={() => navigate("/login")}
                    >
                        Login
                    </div>
                </>
            )}
        </div>
    );
};

export default NavBar;
