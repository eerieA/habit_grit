import { useState, useEffect } from 'react';
import supabase from "./supabase.js";

import SignInForm from './signIn.js';
import HabitsTable from './habitsTable.js';
import { testUid } from './constants.js';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// This is the main component App
function App() {
  const [habits, setHabits] = useState([]);
  const [habitRecordCnt, setHabitRecordCnt] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isHabitsUpdFinished, setIsHabitsUpdFinished] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [localUid, setLocalUid] = useState('');
  const [localEmail, setLocalEmail] = useState('');

  const handleUserInfoChange = (newUid, newEmail) => {
    setLocalUid(newUid);
    setLocalEmail(newEmail);
    setIsSignedIn(true);
  }

  const refetchHabits = async (uid) => {
    setIsLoading(true);

    try {
      // Fetch rows from Habits table where the Uid corresponds to the passed in Uid
      let { data: habits, error } = await supabase.from("Habits").select("*").eq('Uid', uid);

      if (error) {
        console.error('Error fetching habits from Supabase:', error);
        return;
      }

      // Get count of rows by getting rows of the joined table where uid is local uid, and store the length in state
      let { data: habitRecordCnt } = await supabase
          .from("HabitRecords")
          .select(`
          Hid,
          LogTime,
          Habits (
            Hid,
            Uid
          )`)
          .eq('Habits.Uid', uid);
      setHabitRecordCnt(habitRecordCnt.length);

      // Then fetch records for each habit from HabitRecords in supabase
      for (let habit of habits) {
        let { data: habitRecords, error: recordError } = await supabase
          .from("HabitRecords")
          .select("*")
          .eq('Hid', habit.Hid) // Reminder: habit id is stored in 'Hid' column, and col name is case sensitive
          .limit(50)
          .order('LogTime', {ascending: true});

        if (recordError) {
          console.error('Error fetching habit records from Supabase:', recordError);
          continue; // Move to the next habit if there was an error
        }

        // Update current habit by appending an array containing its records
        habit.records = habitRecords;
      }

      // Store finalized habits into the state array
      setHabits(habits);

    } catch (error) {
      console.error('Error:', error);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    // Whenever habits data changes, check if there are enough habit records
    // If there are, mark the update as finished
    var cnt = 0;
    for (let habit of habits) {
      if (habit.records) {
        cnt += habit.records.length;
      }
    }

    if (cnt >= habitRecordCnt) {
      setIsHabitsUpdFinished(true);
    }
  }, [habits, habitRecordCnt]);

  useEffect(() => {
    if (isHabitsUpdFinished) {
      console.log("isHabitsUpdFinished is true now.");
    }    
  }, [isHabitsUpdFinished, habits]);

  useEffect(() => {
    // This effect is ideally triggered on successful user signup/login, but if no meaningful uid,
    // it will retrieve some placeholders (example data)
    if (localUid !== '') {
      const fetchData = async () => {
        await refetchHabits(localUid);
      };
      fetchData();

      // Since localUid not empty string means there was signining in before, here we reset it to false
      // AFTER refecthing. If earlier, there will be a glitch showing the sample user data.
      setIsSigningIn(false);
    } else {
      const fetchData = async () => {
        await refetchHabits(testUid);
      };
      fetchData();
    }
  }, [localUid]);

  useEffect(() => {
    // This effect is triggered on page load
    const fetchData = async () => {
      await refetchHabits(testUid);
    };
    fetchData();
    // This state has to be reset to true here, not inside refetchHabits(.)
    setIsHabitsUpdFinished(true);
  }, []);

  
  return (
    <div>
      <Header />
      <div className='main'>
        <div className='top-container'>
          <SignInForm onUserInfoFetched={handleUserInfoChange} setPrtIsSigningIn={setIsSigningIn} />
        </div>

        <div className='main-container'>
          {isSignedIn ? (
            <AddHabitForm uid={localUid} onAddHabit={refetchHabits} />
          ) : (
            <div>(Below is example habits. Sign in to add your own :D)</div>
          )}
        </div>

        <div className='main-container'>
          {(isLoading || isSigningIn) ? (
            <Loader />
          ) : (
            <HabitsTable habits={habits} localUid={localUid} isHabitsUpdFinished={isHabitsUpdFinished} refetchHabits={refetchHabits} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;


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
          <div className='h-dist-container'>
            <button type="submit" className="btn btn-info">Submit</button>
            <button type="button" className="btn btn-secondary" onClick={closeAddHabit}>Cancel</button>
          </div>
        </form>
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
