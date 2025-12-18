import React, { useState } from "react";
import axios from "axios";
import "./authStyles.css";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // const response = await axios.post("/api/register", {
      const response = await axios.post("http://localhost:5000/api/register", {
        username,
        email,
        age,
        gender,
        password,
      });
      if (response.status === 201) {
        setSuccessMessage("Registration successful!");
        setErrorMessage("");
        // Clear form fields
        setUsername("");
        setEmail("");
        setAge("");
        setGender("");
        setPassword("");
      }
    } catch (error) {
      setErrorMessage("Failed to register. Please check your input.");
      setSuccessMessage("");
    }
  };

  return (
    <div className="Register">
      <div className="register-container">
        <h2 className="poppins-bold">Join the Reconnect Community </h2>
        <hr />
        <form onSubmit={handleSubmit} className="register-form">
          <div className="input-group">
            <label className="poppins-semibold">Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Username"
              className="register-input"
            />
          </div>
          <div className="input-group">
            <label className="poppins-semibold">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email"
              className="register-input"
            />
          </div>
          <div className="input-group">
            <label className="poppins-semibold">Age:</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
              placeholder="Age"
              className="register-input"
            />
          </div>
          <div className="input-group">
            <label className="poppins-semibold">Gender:</label>
            <input
              type="text"
              value={gender}
              placeholder="Gender"
              onChange={(e) => setGender(e.target.value)}
              className="register-input"
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
              className="register-input"
            />
          </div>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          {successMessage && (
            <p className="success-message">{successMessage}</p>
          )}
          <div className="btn-container">
            <button type="submit" className="bn632-hover bn20 poppins-bold">
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
