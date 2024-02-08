import { useState, useEffect } from 'react';
import supabase from "./supabase.js";
import RegistrationForm from './registration.js';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// This is the main app function, with some child functions in it
function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [habits, setHabits] = useState([]);

  useEffect(
    function () {
    // Function to fetch all descriptions from the "Habits" table
    const fetchHabits = async () => {

      setIsLoading(true);

      try {
        // Fetch all rows from Habits table
        let { data: habits, error } = await supabase.from("Habits").select("*");

        if (error) {
          console.error('Error fetching habits from Supabase:', error);
          return;
        }

        // Store habits into the state array
        //console.log('habits:', habits);
        setHabits(habits);
        
      } catch (error) {
        console.error('Error:', error);
      }

      setIsLoading(false);
    };

    // Call the function to fetch item IDs
    fetchHabits();
  }, []);

  return (
    <div>
      <Header/>
      <div className='main'>
        <div className='top-container'>
          <RegistrationForm />
        </div>

        <div className='main-container'>
        {isLoading ? (
          <Loader />
        ) : (
          <table className='table table-hover'>
            <thead className='table-info' key="jfkdh3646"><tr>
              <th style={{ width: '70%' }}>Habit</th>
              <th style={{ width: '15%' }}>Frequency</th>
              <th style={{ width: '15%' }}>Per</th>
            </tr></thead>
            {habits.map(habit => (
            <tbody className='table-primary' key={habit.Hid}><tr>
              <td>{habit.HDscr}</td>
              <td>{habit.GoalFq}</td>
              <td>{habit.GoalFqType}</td>
            </tr></tbody>
            ))}
          </table>
        )}
        </div>
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
        <img src="logo512.png" alt="logo" />
        <h1>{appTitle}</h1>
      </div>
    </header>
  );
}

// Function to display a loading message when awaiting responses
function Loader() {
  return <p className="message">Loading...</p>;
}

export default App;
