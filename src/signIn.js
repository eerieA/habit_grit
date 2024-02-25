import { useGoogleLogin } from '@react-oauth/google';
import React, { useState } from "react";
import axios from 'axios';

// Function that constructs the registration form
function SignInForm() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [password, setPassword] = useState('');

  const handleSignIn = async () => {
    // Currentlyl just set local variable as true
    setIsSignedIn(true);
  };

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
      ).catch(function (error) {
        // handle error
        console.log("error within catch:", error);
        if (error.response.status === 400) {
          alert(error.response.data.error);
        } else {
          alert(error.response.data.error);
        }
      });

      if (signupRes) {
        if (signupRes.status === 200) {
          // If sign-up was successful, set the user as signed in
          handleSignIn();
        }
      }

    },
    onError: errorResponse => console.log("errorResponse:", errorResponse),
  });

  const handleRegister = async (e) => {
    // Prevent page reload. Otherwise the response cannot be received (failed to fetch).
    e.preventDefault();
    // Then call the function doing Google auth
    googleLogin();
  }

  return (
    <div className="form-container">
      {isSignedIn ? (
        <p>Signed in</p>
      ) : (
        <>
          <h3>User info</h3>
          <p>Seems you are not signed in...</p>
          <form className="form-container" onSubmit={handleRegister}>
            <label>Enter password for this app:</label>
            <input type="password" className="form-control" value={password}
              onChange={(e) => setPassword(e.target.value)}
              id="InputPassword" placeholder="Enter password" />
            <button type="submit" className="btn btn-info">And Google sign in 👀</button>
          </form>
        </>
      )
      }
    </div>
  );
}

export default SignInForm;
