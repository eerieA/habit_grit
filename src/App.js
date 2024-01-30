import { useState, useEffect } from 'react';
import supabase from "./supabase.js";

import logo from './logo.svg';
import './App.css';


function App() {

  const [hdscrs, setHabits] = useState([]);

  useEffect(
    function () {
    // Function to fetch all IDs from the "Habits" table
    async function fetchHids() {
      try {
        // Fetch all rows from Habits table
        let { data: habits, error } = await supabase.from("Habits").select("*");

        if (error) {
          console.error('Error fetching habits from Supabase:', error);
          return;
        }

        // Extract the IDs from the response data
        console.log('habits:', habits);
        const hdscrs = habits.map(habit => habit.HDscr);
        setHabits(hdscrs);
        
      } catch (error) {
        console.error('Error:', error);
      }
    };

    // Call the function to fetch item IDs
    fetchHids();
  }, []); // Run the effect only once when the component mounts

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
      </header>
      <h1>
        Hello world.
      </h1>
      <ul>
        {hdscrs.map(hdscr => (
          <li>{hdscr}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
