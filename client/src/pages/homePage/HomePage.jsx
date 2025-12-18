import React from 'react'
import './homePage.css'
import Header from '../../components/layout/Header'
import { useNavigate } from 'react-router-dom'
const HomePage = () => {
  const navigate = useNavigate();
  return (
    <div className='home-page'>
      <div className="home-nav-bar">
        <Header />
      </div>
      <div className="home-content">
        <div className="home-content-left">
          <div className="head-line">
            Reconnect
          </div>

          <div className="explain-home">
            The Personal AI Counsellor offers tailored emotional support using advanced AI technology. It provides real-time insights and personalized advice, helping users manage stress, enhance well-being, and make informed decisions.
          </div>
          <button
            className="home-zenai"
            onClick={() => navigate("/assist")}
          >
            Try ZenAI
          </button>
        </div>
        <div className="home-content-right">

        </div>

      </div>
      <div className="home-content-2">
        <div className="home-content-2-cards">
          <img src="" alt="" />
        </div>
        <div className="home-content-2-cards">
          <img src="" alt="" />
        </div>
        <div className="home-content-2-cards">
          <img src="" alt="" />
        </div>
      </div>
    </div>
  )
}

export default HomePage
