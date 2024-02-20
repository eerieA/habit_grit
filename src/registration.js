import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

// Function that constructs the registration form
function RegistrationForm() {

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log(tokenResponse);

      const tmpToken = tokenResponse.access_token
      const userInfo = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        { headers: { "Authorization": `Bearer ${tokenResponse.access_token}` } },
      );

      console.log(userInfo.data);
      const tmpEmail = userInfo.data.email
      console.log(tmpEmail);

      const signupRes = await axios.post(
        "https://us-central1-habit-grit.cloudfunctions.net/signupFunction",
        {
          email: tmpEmail,
          password: "password123"
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

  async function testAxios() {
    const res = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          "Authorization": "Bearer ya29.a0*"
        }
      }
    );
    console.log(res);
  }

  return (
    <div className="form-container">
      <h3>User info</h3>
      <p>Seems you are not signed in...</p>
      <button className="btn btn-info" onClick={() => googleLogin()}>👀 Sign in with Google</button>
    </div>
  );
}

export default RegistrationForm;
