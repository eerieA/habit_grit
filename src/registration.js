import React, { useState } from "react";
import { useGoogleLogin } from '@react-oauth/google';

const config = require('./config');
const axios = require('axios').default;

// Function that constructs the registration form
function RegistrationForm() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log(tokenResponse);
      const userInfo = await fetch(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } },
      );

      const data = await userInfo.json();
      console.log(data);
      const localEmail = data.email
      setEmail(localEmail)
      console.log("Now local email is:", email);
    },
    onError: errorResponse => console.log(errorResponse),
  });

  return (
    <div className="form-container">
      <h3>User info</h3>
      <p>Seems you are not signed in...</p>
      <button className="btn btn-info" onClick={() => googleLogin()}>👀 Sign in with Google</button>
    </div>
  );
}

export default RegistrationForm;
