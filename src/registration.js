import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

// Function that constructs the registration form
function RegistrationForm() {

  function generatePassword(email) {
    let password = '';
    for (let i = 0; i < email.length; i++) {
      let charCode = email.charCodeAt(i);
      // Each character Unicode multiply by 7 and wrap around A-Z
      charCode = (charCode * 7) % 26 + 65;
      password += String.fromCharCode(charCode);
    }

    // Add some random characters or digits to make it less predictable
    const randomChars = Math.random().toString(36).slice(2, 8);

    return password + randomChars;
  }

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log(tokenResponse);

      const tmpToken = tokenResponse.access_token
      const userInfo = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        { headers: { "Authorization": `Bearer ${tokenResponse.access_token}` } },
      );

      const tmpEmail = userInfo.data.email;
      const tmpPassword = generatePassword(tmpEmail);

      const signupRes = await axios.post(
        "https://us-central1-habit-grit.cloudfunctions.net/signupFunction",
        {
          email: tmpEmail,
          password: tmpPassword
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

  return (
    <div className="form-container">
      <h3>User info</h3>
      <p>Seems you are not signed in...</p>
      <button className="btn btn-info" onClick={() => googleLogin()}>👀 Sign in with Google</button>
    </div>
  );
}

export default RegistrationForm;
