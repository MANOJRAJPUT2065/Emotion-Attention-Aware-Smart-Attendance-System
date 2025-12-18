import { Route, Routes } from 'react-router-dom';
import CommunitySupport from './pages/CommunitySupport/CommunitySupport';
import Login from './pages/AuthPages/Login';
import HomePage from './pages/homePage/HomePage';
import Register from './pages/AuthPages/Register';
import DMPage from './pages/CommunitySupport/DM/DMPage';
import FaceEmotionDetection from './pages/ai/test'
import './App.css';
import { useEffect } from 'react';
import LandingPage from './pages/landing/LandingPage';
import Quiz from './pages/scoreCheck/scorecheck';

function App() {
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

  return (
    <Routes>
      <Route exact path="/" element={<LandingPage />} />
      <Route exact path="/home" element={<LandingPage />} />
      <Route exact path="/register" element={<Register />} />
      <Route exact path="/login" element={<Login />} />
      <Route exact path="/community" element={<CommunitySupport />} />
      <Route exact path="/community/dm" element={<DMPage />} />
      <Route exact path="/assist" element={<FaceEmotionDetection />} />
      <Route exact path="/quiz" element={<Quiz />} />
    </Routes>
  );
}

export default App;
