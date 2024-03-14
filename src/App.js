import { useState, useEffect } from 'react';
import supabase from "./supabase.js";
import SignInForm from './signIn.js';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// This is the main app function, with some child functions in it
function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [habits, setHabits] = useState([]);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [localUid, setLocalUid] = useState('');
  const [localEmail, setLocalEmail] = useState('');

  useEffect(() => {
    // This effect will be triggered whenever uid changes
    console.log("[App.js] Local uid is", localUid);
    console.log("[App.js] Local email is", localEmail);
  }, [localUid, localEmail]);

  useEffect(() => {
    // This effect fetches relevant rows from the "Habits" table based on current localUid
    const fetchHabits = async () => {

      setIsLoading(true);

      // Defaults to the test User's Uid
      var tmpUid = 'd1a3fba1-0fc9-45b5-bdd8-934a1b05f516';
      if (localUid !== '') {
        tmpUid = localUid;
        console.log("[App.js]::useEffect Local uid is", localUid);
      }

      try {
        // Fetch rows from Habits table where the Uid corresponds to the tmpUid
        let { data: habits, error } = await supabase.from("Habits").select("*").eq('Uid', tmpUid);

        if (error) {
          console.error('Error fetching habits from Supabase:', error);
          return;
        }

        // Store habits into the state array
        setHabits(habits);

      } catch (error) {
        console.error('Error:', error);
      }

      setIsLoading(false);
    };

    // Call the function to fetch item IDs
    fetchHabits();
  }, [localUid]);

  const handleUserInfoChange = (newUid, newEmail) => {
    setLocalUid(newUid);
    setLocalEmail(newEmail);
    setIsSignedIn(true);
  }

  return (
    <div>
      <Header />
      <div className='main'>
        <div className='top-container'>
          <SignInForm onUserInfoFetched={handleUserInfoChange} />
        </div>

        <div className='main-container'>
          {isSignedIn ? (
            <AddHabitForm uid={localUid} />
          ) : (
            <div>(Sign in to add your habits)</div>
          )}
        </div>

        <div className='main-container'>
          {isLoading ? (
            <Loader />
          ) : (
            <div>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

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

function AddHabitForm({ uid }) {
  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false);
  const [hDescription, setHDescription] = useState('');
  const [hFrequency, setHFrequency] = useState('');
  const [hFqType, setHFqType] = useState('W');
  const [formSumbmitError, setFormSumbmitError] = useState('');

  const openAddHabit = async () => {
    setIsAddHabitOpen(true);
  };

  const handleAddHabit = async (e) => {
    e.preventDefault();
    
    console.log("hDescription is", hDescription);
    console.log("hFrequency is", hFrequency);
    console.log("hFqType is", hFqType);
    if (hDescription === '' || hFrequency === '') {
      setFormSumbmitError("Description or frequency is empty! Please try again.")
      return;
    } else {
      setFormSumbmitError("")
    }
    /* console.log("[openAddHabit] passed in uid is", uid);
    const { data, error } = await supabase
      .from('Habits')
      .insert([
        { Uid: uid, GoalFq: 2, GoalFqType: 'W', HDscr: 'Test description' },
      ])
      .select();
    console.log("[openAddHabit] data is", data); */

    setIsAddHabitOpen(false);
  };

  return (
    <div className='form-container'>
      Add a habit
      {formSumbmitError !== '' ? (
        <form className="form-container">
          <label className='text-error'>{formSumbmitError}</label>
        </form>
      ):( <></> )}
      {isAddHabitOpen ? (
        <form className="form-container" onSubmit={handleAddHabit}>
          <label>Habit Description:</label>
          <input type="text" className="form-control" value={hDescription}
            onChange={(e) => setHDescription(e.target.value)}
            id="InputHDescription" placeholder="Text description" />
          <label>Target frequency:</label>
          <input type="number" className="form-control" value={hFrequency}
            onChange={(e) => setHFrequency(e.target.value)}
            id="InputHFrequency" placeholder="Days per week/month" />
          <label>Target frequency type:</label>
          <select id="InputHFqType" className="form-control" value={hFqType}
            onChange={(e) => setHFqType(e.target.value)}>
            <option value="W">Per week</option>
            <option value="M">Per month</option>
          </select>
          <button type="submit" className="btn btn-info">Submit</button>
        </form>
      ) : (
        <button type="button" className="btn btn-info" onClick={openAddHabit}>Add</button>
      )}

    </div>
  )
}