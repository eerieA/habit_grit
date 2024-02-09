import React, { useState } from "react";
import supabase from "./supabase.js";

// Function that constructs the registration form
function RegistrationForm() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    // handleRegister function body
    console.log('email:', email);
    console.log('password:', password);

    try {
      const response = await fetch('http://localhost:3002/signup', {
        method: 'POST',
        headers: {
          "Content-Type": "text/plain",
          "Accept": "*/*"
        },
        body: "test"
      });
      const data = await response.json()
      console.log("Response:", response);
      console.log("Response status:", response.status);
      console.log("Response url:", response.url);
      console.log("Response json data:", data);
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
