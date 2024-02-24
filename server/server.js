const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// Import the signup handler function from signup.js
const signup = require('./signup').signup;

// Middleware to parse JSON request body
app.use(bodyParser.json());

// Define the route for the welcome endpoint
app.post('/signup', (req, res) => {
    return signup(req, res);
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
