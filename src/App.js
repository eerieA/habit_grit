import { useState, useEffect } from 'react';
import supabase from "./supabase.js";
import SignInForm from './signIn.js';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// This is the main component App
function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [habits, setHabits] = useState([]);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [localUid, setLocalUid] = useState('');
  const [localEmail, setLocalEmail] = useState('');

  const handleUserInfoChange = (newUid, newEmail) => {
    setLocalUid(newUid);
    setLocalEmail(newEmail);
    setIsSignedIn(true);
  }

  const refetchHabits = async (uid) => {
    setIsLoading(true);

    // Defaults to the test User's Uid
    var tmpUid = 'd1a3fba1-0fc9-45b5-bdd8-934a1b05f516';
    if (uid !== '') {
      tmpUid = uid;
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
  }

  useEffect(() => {
    // This effect will be triggered whenever localUid and localEmail changes
    console.log("[App.js] Local uid is", localUid);
    console.log("[App.js] Local email is", localEmail);
  }, [localUid, localEmail]);

  useEffect(() => {
    // This effect is basically triggered on successful user signup/login
    if (localUid) {
      refetchHabits(localUid);
    }
  }, [localUid]);

  return (
    <div>
      <Header />
      <div className='main'>
        <div className='top-container'>
          <SignInForm onUserInfoFetched={handleUserInfoChange} />
        </div>

        <div className='main-container'>
          {isSignedIn ? (
            <AddHabitForm uid={localUid} onAddHabit={refetchHabits} />
          ) : (
            <div>(Sign in to add your habits)</div>
          )}
        </div>

        <div className='main-container'>
          {isLoading ? (
            <Loader />
          ) : (
            <HabitsTable habits={habits} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;


// Below is child component HabitsTable

function HabitsTable({ habits }) {
  return (
    <div>
      <table className='table table-hover' key="habit-table">
        <thead className='table-info' key="habit-table-header">
          <tr>
            <th style={{ width: '70%' }}>Habit</th>
            <th style={{ width: '15%' }}>Frequency</th>
            <th style={{ width: '15%' }}>Per</th>
          </tr>
        </thead>
        {habits.map(habit => (
          <tbody className='table-primary' key={habit.Hid}>
            <tr>
              <td>{habit.HDscr}</td>
              <td>{habit.GoalFq}</td>
              <td>{habit.GoalFqType}</td>
            </tr>
          </tbody>
        ))}
      </table>
    </div>
  );
}


// Below is child component AddHabitForm

function AddHabitForm({ uid, onAddHabit }) {
  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false);
  const [hDescription, setHDescription] = useState('');
  const [hFrequency, setHFrequency] = useState('');
  const [hFqType, setHFqType] = useState('W');
  const [formSubmitError, setFormSubmitError] = useState('');

  const openAddHabit = () => {
    setIsAddHabitOpen(true);
  };

  const closeAddHabit = () => {
    setIsAddHabitOpen(false);
  };

  const handleAddHabit = async (e) => {
    e.preventDefault();

    if (hDescription === '' || hFrequency === '') {
      setFormSubmitError("Description or frequency is empty! Please try again.")
      return;
    } else {
      setFormSubmitError("")

      /* Call API to insert the habit item */
      const { data, error } = await supabase
        .from('Habits')
        .insert([
          { Uid: uid, GoalFq: hFrequency, GoalFqType: hFqType, HDscr: hDescription },
        ])
        .select();
      console.log("[openAddHabit] data is", data);

      if (error) {
        console.error('Error adding habit to Supabase:', error);
        return;
      }

      // Call the function pointed to by the argument onAddHabit, which currently refetches the habits table
      onAddHabit(uid);

      // Reset fields of the form
      setHDescription("");
      setHFrequency("");
      setHFqType("W");
    }

    setIsAddHabitOpen(false);
  };

  return (
    <div className='l2-container'>
      <p className="l2-title">Add a habit</p>
      {formSubmitError !== '' ? (
        <form className="form-container">
          <label className='text-error'>{formSubmitError}</label>
        </form>
      ) : (<></>)}
      {isAddHabitOpen ? (
        <>
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
        </form>
        <div className='h-dist-container'>
          <button type="submit" className="btn btn-info">Submit</button>
          <button type="button" className="btn btn-secondary" onClick={closeAddHabit}>Cancel</button>
        </div>
        </>
      ) : (
        <button type="button" className="btn btn-info" onClick={openAddHabit}>Add</button>
      )}

    </div>
  )
}


// Below are child components that does not need passing data out to the main app function

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
