const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

const express = require('express');
const cors = require('cors');
const app = express();
const port = 3002;

// Initialize Supabase client
dotenv.config();
const supabaseUrl = process.env.Supa_url;
const supabaseKey = process.env.Supa_Anon_Key;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middlewares to parse request bodies
app.use(express.json());
// Enable CORS for all routes
app.use(cors());

// Route for a simple visit (sanity check)
app.get('/', (req, res) => {
    res.send('Hello from Express.js backend!');
});

// Route for user signup
app.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    console.log('Email:', email);
    console.log('Password:', password);

    //res.status(200).json({ message: 'Received signup request' });

    // Sign up user using Supabase Auth API
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            console.error('Error signing up user:', error);
            return res.status(500).send({ error: 'Failed to sign up user' });
        }

        console.log('User signed up successfully:', data);
        console.log('data.user:', data.user);
        console.log('data.user.id:', data.user.id);
        return res.status(200).send({ message: 'User signed up successfully' });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).send({ error: 'Internal server error' });
    }
});

// Start the Express server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
