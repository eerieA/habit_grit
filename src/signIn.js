import { useGoogleLogin } from '@react-oauth/google';
import React, { useState, useEffect } from "react";
import axios from 'axios';

function UserProfile({ uid }) {
  // uid is passed in as a prop from the caller, so there has to be curly brackets in the signature here
  return <p>Signed in {uid}</p>
}

// Function that constructs the sign in/up form
function SignInForm() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [localUid, setLocalUid] = useState('');

  useEffect(() => {
    // This effect will be triggered whenever uid changes
    console.log("Local uid is", localUid);
  }, [localUid]);

  const handleSignIn = async (uid) => {
    // Set local variables
    setIsSignedIn(true);
    setLocalUid(uid);
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
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
          // If sign up or sign in was successful, get uid, and set the user as signed in
          const uid = signupRes.data.uid;
          handleSignIn(uid);
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
      {localUid !== '' ? (
        <>
          <UserProfile uid={localUid} />
        </>
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
