import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./authStyles.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const INACTIVITY_TIMEOUT = 15 * 60 * 1000;
  let inactivityTimer;

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer) clearTimeout(inactivityTimer);

    inactivityTimer = setTimeout(() => {
      handleLogout();
    }, INACTIVITY_TIMEOUT);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("username");
    console.log("Logged out due to inactivity");
    navigate("/Login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("/api/login", { username, password });
      if (response.status === 200) {
        console.log("Login successful");
        localStorage.setItem("authToken", response.data.token);
        localStorage.setItem("username", username);
        resetInactivityTimer();
        navigate("/home");
      }
    } catch (error) {
      setErrorMessage("Invalid username or password");
    }
  };

  useEffect(() => {
    const handleUserActivity = () => {
      resetInactivityTimer();
    };

    window.addEventListener("mousemove", handleUserActivity);
    window.addEventListener("keydown", handleUserActivity);

    return () => {
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
    };
  }, [resetInactivityTimer]);

  return (
    <div className="Login">
      <div className="login-container">
        <h2 className="poppins-bold">Login</h2>
        <hr />
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label className="poppins-semibold">Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Username"
              className="login-input"
            />
          </div>
          <div className="input-group">
            <label className="poppins-semibold">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Password"
              className="login-input"
            />
          </div>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          <div className="btn-container">
            <button type="submit" className="bn632-hover bn20 poppins-bold">
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
