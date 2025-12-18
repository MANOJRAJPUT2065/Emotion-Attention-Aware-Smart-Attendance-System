import React from 'react';
import './LandingPage.css';
import NavBar from '../../components/layout/NavBar';
import StarsCanvas from '../../components/layout/StarBackground';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';



const LandingPage = () => {
    const isLoggedIn = () => {
        return localStorage.getItem('authToken') !== null;
    };

    const clearCookies = () => {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            clearCookies();
        }, 3600000);

        return () => clearInterval(interval);
    }, []);

    const navigate = useNavigate();
    return (
        <>
            <div className='landing-page'>
                <div className='background'></div>
                <StarsCanvas />
                <div className="landing-nav-bar">
                    <NavBar />
                </div>
                <div className="landing-content">
                    <div className="landing-content-left">
                        <div className="explain-us">
                            About Us
                        </div>
                        <div className="head-line">
                            Reconnect : AI Powered Personal Counselor
                        </div>
                        <p
                            className="assist-button hover-filled-slide-right"
                            onClick={() => navigate("/assist")}
                        >
                            <span>Try ZenAI</span>
                        </p>
                    </div>
                    <div className="landing-content-right">
                        <p class="rightBtn rightBtn-3 hover-border-1">
                            <h4 className='landing-features'>Personal AI Counselor, Always With You</h4>
                            <p className='feature-description'>Receive real-time, compassionate voice responses tailored to your emotions, offering warmth and support like a trusted friend.
                            </p>
                        </p>
                        <p class="rightBtn rightBtn-3 rightBtn-even hover-border-2">
                            <h4 className='landing-features'>Understand Your Feelings in Real-Time</h4>
                            <p className='feature-description'>ZenAI's voice and facial analysis detects emotional shifts, offering instant personalized support with EmotionTrack.</p>
                        </p>
                        <p class="rightBtn rightBtn-3 hover-border-2">
                            <h4 className='landing-features'>Private and Secure Support</h4>
                            <p className='feature-description'>Your emotional wellbeing is handled with care, ensuring a secure and private space to express yourself freely without judgment.</p>
                        </p>
                    </div>

                </div>
            </div>
        </>
    );
}

export default LandingPage;
