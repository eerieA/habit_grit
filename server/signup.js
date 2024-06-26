// This is a backup / test version of sign up function. The deployed version is on Google Cloud Function.
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Initialize Supabase client
dotenv.config();
const supabaseUrl = process.env.Supa_url;
const supabaseKey = process.env.Supa_Anon_Key;
const supabase = createClient(supabaseUrl, supabaseKey);

// Function handler for user signup
exports.signup = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('req.body:', req.body);
        // Be careful of the keys' letter cases
        console.log('Email:', email);
        console.log('Password:', password);

        // Set CORS headers
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST'); // Add other HTTP methods as needed
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Add other header types as needed

        // Handle preflight request
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }

        // Sign up user using Supabase Auth API
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            if (error.message === "User already registered") {
                // If user is already registered, try to sign in
                const response = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                // For some reason if use `const {data, error} = ...` they will be undefined, so have to store them this way
                const data = response.data;
                const signInError = response.error;

                if (signInError) {
                    if (signInError.message === "Invalid login credentials") {
                        return res.status(400).send({ error: 'Invalid login credentials. Password wrong?' });
                    } else {
                        console.log(error.message);
                        console.error('Error signing in user:', signInError);
                        return res.status(500).send({ error: 'Failed to sign in user' });
                    }                    
                }

                console.log('User signed in successfully:', data.user);
                // On success, return the user's Uid and email to the frontend
                return res.status(200).send({ uid: data.user.id, email: data.user.email });
            } else {
                console.log(error.message);
                console.error('Error signing up user:', error);
                return res.status(500).send({ error: 'Failed to sign up user' });
            }
        }

        console.log('User signed up successfully:', data);
        return res.status(200).send({ uid: data.user.id });
    } catch (error) {
        // In case of error, print error info in terminal
        console.error('Error:', error);

        // And send error message to the client side
        return res.status(500).send({ error: 'Internal server error' });
    }
};