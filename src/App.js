import { useState, useEffect } from 'react';
import supabase from "./supabase.js";

import './App.css';

// This is the main app function, with some child functions in it
function App() {

  const [habits, setHabits] = useState([]);

  useEffect(
    function () {
    // Function to fetch all descriptions from the "Habits" table
    async function fetchHabits() {
      try {
        // Fetch all rows from Habits table
        let { data: habits, error } = await supabase.from("Habits").select("*");

        if (error) {
          console.error('Error fetching habits from Supabase:', error);
          return;
        }

        // Store habits into the state array
        console.log('habits:', habits);
        setHabits(habits);
        
      } catch (error) {
        console.error('Error:', error);
      }
    };

    // Call the function to fetch item IDs
    fetchHabits();
  }, []);

  return (
    <div>
      <Header/>
      <div className='main-container'>
        <ul>
          {habits.map(habit => (
            <li key={habit.Hid}>
              {habit.HDscr} {habit.GoalFq} {habit.GoalFqType}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Below are child functions that does not need passing data out to the main app function

// Function that constructs the header
function Header() {
  const appTitle = "Habit Grit";

  return (
    <header className="header">
      <div className="logo">
        <img src="logo.png" alt="logo" />
        <h1>{appTitle}</h1>
      </div>
    </header>
  );
}

export default App;
