import { useState, useEffect } from 'react';
import supabase from "./supabase.js";
import dayjs from 'dayjs';

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

      // Then fetch records for each habit from HabitRecords in supabase
      for (let habit of habits) {
        let { data: habitRecords, error: recordError } = await supabase
          .from("HabitRecords")
          .select("*")
          .eq('Hid', habit.Hid); // Reminder: habit id is stored in 'Hid' column, and col name is case sensitive

        if (recordError) {
          console.error('Error fetching habit records from Supabase:', recordError);
          continue; // Move to the next habit if there was an error
        }

        // Update current habit by appending an array containing its records
        habit.records = habitRecords;
      }
      //console.log('Habits with records:', habits);

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
    // This effect is ideally triggered on successful user signup/login, but if no meaningful uid,
    // it will retrieve some placeholders (example data)
    if (localUid) {
      refetchHabits(localUid);
    } else {
      refetchHabits('');
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
            <div>(Below is example habits. Sign in to add your own :D)</div>
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

function getCurrentWeekDates() {
  const startOfWeek = dayjs().startOf('week');
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const date = startOfWeek.add(i, 'day');
    weekDates.push(date);
  }
  console.log("startOfWeek:", startOfWeek);
  console.log("weekDates:", weekDates);
  return weekDates;
}

function HabitsTable({ habits }) {

  const weekDates = getCurrentWeekDates();

  return (
    <div>
    {habits.map(habit => (
      <table className='table table-hover' key={habit.Hid}>

        <thead className='table-info' key={habit.Hid + "-header"}>
          <tr>
            <th style={{ width: '64%' }}>Habit</th>
            <th style={{ width: '12%' }}>Frequency</th>
            <th style={{ width: '12%' }}>Per</th>
            <th style={{ width: '12%' }}>Logged</th>
          </tr>
        </thead>

        <tbody className='table-primary'>
          <tr>
            <td>{habit.HDscr}</td>
            <td>{habit.GoalFq}</td>
            {/* This is habit goal frequency type, W(eek) or M(onth) */}
            <td>{habit.GoalFqType}</td>
            {/* habit.records is habit records from HabitRecords table */}
            <td>{habit.records && habit.records.length} times</td>
          </tr>

          {/* Render habit.records if it exists */}
          {habit.records && habit.records.map((record, index) => (
            <tr key={record.Hid + index}>
              <td>{index}</td>
              <td colSpan={3}>{record.LogTime}</td>
            </tr>
          ))}
        </tbody>
        
        <tfoot>
          <tr>
            <td className='table-primary' colSpan={4}>
              <table className='table table-hover'>
                <tbody className='table-secondary'>
                  <tr>
                    {weekDates.map((date, index) => (
                      <td key={index}>{date.format('MMM-DD')}</td>
                    ))}
                  </tr>
                  <tr>
                    {weekDates.map((date, index) => (
                      <td key={index + "-state"}>
                        <button className="btn btn-outline-secondary">Zzz</button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tfoot>
        
      </table>
      ))}
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
