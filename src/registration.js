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
      let { data, error } = await supabase.auth.signUp({
          email: email,
          password: password,
      });

      if (error) {
          console.error('Error registering user:', error.message);
      } else {
          console.log('User registered successfully:', data);
      }
    } catch (error) {
      console.error('Error registering user:', error.message);
    }

    let { data2, error } = await supabase.from("Habits").select("*");
    console.log(data2)
  };

  
  return (
    <form className="form-container" onSubmit={handleRegister}>
      <h3>Register</h3>
      <div className="form-group">
        <label htmlFor="InputEmail">Email address</label>
        <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} id="InputEmail" aria-describedby="emailHelp" placeholder="Enter email"/>
        <small id="emailHelp">We'll never share your email with anyone else.</small>
      </div>
      <div className="form-group">
        <label htmlFor="InputPassword">Password</label>
        <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} id="InputPassword" placeholder="Enter password"/>
      </div>
      <button type="submit" className="btn btn-info">Submit</button>
    </form>
  );
}

export default RegistrationForm;
