import { useGoogleLogin } from '@react-oauth/google';
import React, { useState } from "react";
import axios from 'axios';

// Function that constructs the registration form
function RegistrationForm() {
  const [password, setPassword] = useState('');

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log(tokenResponse);

      const tmpToken = tokenResponse.access_token
      const userInfo = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        { headers: { "Authorization": `Bearer ${tokenResponse.access_token}` } },
      );

      const tmpEmail = userInfo.data.email;

      const signupRes = await axios.post(
        "https://us-central1-habit-grit.cloudfunctions.net/signupFunction",
        {
          email: tmpEmail,
          password: password
        },
        {
          headers: {
            "Authorization": `Bearer ${tmpToken}`,
            "Content-Type": "application/json"
          }
        }
      );
      console.log(signupRes);

    },
    onError: errorResponse => console.log(errorResponse),
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    googleLogin();
  }

  return (
    <div className="form-container">
      <h3>User info</h3>
      <p>Seems you are not signed in...</p>
      <form className="form-container" onSubmit={handleRegister}>
        <label>Enter password for this app:</label>
        <input type="password" className="form-control" value={password}
          onChange={(e) => setPassword(e.target.value)}
          id="InputPassword" placeholder="Enter password" />
        <button type="submit" className="btn btn-info">And Google sign in 👀</button>
      </form>
    </div>
  );
}

export default RegistrationForm;
