import React, { useState } from "react";

const config = require('./config');

// Function that constructs the registration form
function RegistrationForm() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e) => {
    // Prevent page reload. Otherwise the response cannot be received (failed to fetch).
    e.preventDefault();

    console.log('email:', email);
    console.log('password:', password);
    console.log('API_BASE_URL:', config.API_BASE_URL);

    // Make request
    try {
      const response = await fetch(`${config.API_BASE_URL}/signup`, 
      {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Accept": "*/*",
          "Connection": "keep-alive"
        },
        body: JSON.stringify({
          "email": email,
          "password": password
        }),
      });
      const data = await response.json();
      console.log("Response message:", data.message);
    } catch (error) {
      console.error('Error:', error);
    }

  };

  return (
    <form className="form-container" onSubmit={handleRegister}>
      <h3>Register</h3>
      <div className="form-group">
        <label htmlFor="InputEmail">Email address</label>
        <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} id="InputEmail" aria-describedby="emailHelp" placeholder="Enter email" />
        <small id="emailHelp">We'll never share your email with anyone else.</small>
      </div>
      <div className="form-group">
        <label htmlFor="InputPassword">Password</label>
        <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} id="InputPassword" placeholder="Enter password" />
      </div>
      <button type="submit" className="btn btn-info">Submit</button>
    </form>
  );
}

export default RegistrationForm;
