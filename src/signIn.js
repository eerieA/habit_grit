import { useGoogleLogin } from '@react-oauth/google';
import React, { useState, useEffect } from "react";
import axios from 'axios';

// Function that constructs the sign in/up form
function SignInForm({ onUserInfoFetched, setPrtIsSigningIn }) {
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [localUid, setLocalUid] = useState('');
  const [localEmail, setLocalEmail] = useState('');

  const handleSignIn = async (uid, email) => {
    // Set local variables
    setLocalUid(uid);
    setLocalEmail(email);

    // Use the function pointer to call the function in App.js
    onUserInfoFetched(uid, email);
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setPrtIsSigningIn(true);

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
        if (error.response.status === 400) {
          // 400 from the cloud function means wrong password
          alert(error.response.data.error);
        } else {
          alert(error.response.data.error);
        }
      });

      if (signupRes) {
        if (signupRes.status === 200) {
          // If sign up or sign in was successful, get uid, and set the user as signed in
          const uid = signupRes.data.uid;
          const email = signupRes.data.email;
          handleSignIn(uid, email);
        }
      }

      setIsLoading(false);

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
      <h3>User info</h3>

      {isLoading ? (
        <Loader />
      ) : (
        <></>
      )
      }

      {localUid !== '' ? (
        <>
          <UserProfile userInfo={{ uid: localUid, email: localEmail }} />
        </>
      ) : (
        <>
          <p>Seems you are not signed in...</p>
          <form className="l2-container" onSubmit={handleRegister}>
            <label>Enter password for this app:</label>
            <input type="password" className="form-control" value={password}
              onChange={(e) => setPassword(e.target.value)}
              id="InputPassword" placeholder="Enter password" />
            <div className='h-dist-container'>
              <button type="submit" className="btn btn-info btn-stretch">And Google sign in 👀</button>
            </div>
          </form>
        </>
      )
      }
    </div>
  );
}

export default SignInForm;

// Below are child functions that does not need passing data out to the main app function

function UserProfile({ userInfo }) {
  // userInfo is passed in as a prop from the caller, so there has to be curly brackets in the signature here
  // Then after unpacking, it is still a dictionary, so just use dot to access members
  return (
    <p>Hello {userInfo.email}!</p>
  );
}

// Function to display a loading message when awaiting responses
function Loader() {
  return <p className="message">Loading...</p>;
}
