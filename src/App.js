import { useState, useEffect } from 'react';
import supabase from "./supabase.js";
import SignInForm from './signIn.js';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// This is the main app function, with some child functions in it
function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [habits, setHabits] = useState([]);
  const [localUid, setLocalUid] = useState('');
  const [localEmail, setLocalEmail] = useState('');

  useEffect(() => {
    // This effect will be triggered whenever uid changes
    console.log("[App.js] Local uid is", localUid);
    console.log("[App.js] Local email is", localEmail);
  }, [localUid, localEmail]);

  useEffect(
    function () {
    // Function to fetch all descriptions from the "Habits" table
    const fetchHabits = async () => {

      setIsLoading(true);

      try {
        // Fetch rows from Habits table where the Uid corresponds to the test User
        let { data: habits, error } = await supabase.from("Habits").select("*").eq('Uid', 'd1a3fba1-0fc9-45b5-bdd8-934a1b05f516');

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

  const handleUserInfoChange = (newUid, newEmail) => {
    setLocalUid(newUid);
    setLocalEmail(newEmail);
  }

  return (
    <div>
      <Header/>
      <div className='main'>
        <div className='top-container'>
          <SignInForm onUserInfoFetched={ handleUserInfoChange }/>
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
