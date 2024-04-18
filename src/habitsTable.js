import React, { useState, useEffect } from 'react';
import supabase from "./supabase.js";
import dayjs from "dayjs";

var utc = require('dayjs/plugin/utc');
var timezone = require('dayjs/plugin/timezone'); // dependent on utc plugin
dayjs.extend(utc);
dayjs.extend(timezone);

function getCurrentWeekDates() {
  const startOfWeek = dayjs().startOf("week");
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const date = startOfWeek.add(i, "day");
    weekDates.push(date);
  }
  return weekDates;
}

function HabitsTable({ habits, localUid, isHabitsUpdFinished, refetchHabits }) {
  const [logBtnStates, setLogBtnStates] = useState(Array(7).fill(false));
  const [logBtnStates2, setLogBtnStates2] = useState({});

  const weekDates = getCurrentWeekDates();
  
  const toggleLogOnDay = async (index, date, hid) => {
    console.log("Passed in date:", date);
    console.log("date.unix():", date.unix());
    console.log("Passed in hid:", hid);
    
    const newButtonStates = [...logBtnStates];
    newButtonStates[index] = !newButtonStates[index];
    setLogBtnStates(newButtonStates);
    console.log("newButtonStates:", newButtonStates);
    
    // Copy current logBtnStates2 state, and initilize as empty dictionary if logBtnStates2 is empty
    const newButtonStates2 = { ...logBtnStates2 } || {};
    newButtonStates2[hid] = newButtonStates2[hid] || Array(7).fill(false);
    newButtonStates2[hid][index] = !newButtonStates2[hid][index];
    setLogBtnStates2(newButtonStates2);

    let { data, error } = await supabase
      .from('HabitRecords')
      .insert([
        { Hid: hid, LogTime: date },
      ])
      .select();

    if (error) {
      if (error.code === '23505') {
        // This is code for duplicate primary key, i.e. the log exists. So toggle it off. i.e. delete.
        let { deleteError } = await supabase
          .from('HabitRecords')
          .delete()
          .eq('Hid', hid)
          .eq('LogTime', date);

        if (deleteError) {
          console.log('deleteError:', deleteError);
        }

        // This means delete was successful. Refetch.
        refetchHabits(localUid || 'd1a3fba1-0fc9-45b5-bdd8-934a1b05f516');
      
      } else {
        // For other errors, print error content
        console.log('Error adding habit to Supabase:', error);
      }

      return;
    }
    
    console.log("Response data:", data);
    // This means insert was successful. Refetch.
    refetchHabits(localUid || 'd1a3fba1-0fc9-45b5-bdd8-934a1b05f516');
  }

  useEffect(() => {
    console.log("[useEffect] logBtnStates2:", logBtnStates2);
  }, [logBtnStates2]);

  useEffect(() => {
    // This effect is triggered on component load
    console.log("refreshed habits:", habits);
    const tmpLogBtnStates = habits.map(habit => {
      const records = habit.records;
      const paddedRecords = [];
      let startRecordIndex = -1;

      // Loop through records to try to find a record that is nearest and after the start of current week
      for (let i = 0; i < records.length; i++) {
        let logTimeUTC = dayjs(records[i]['LogTime']).tz("GMT");
        if (logTimeUTC.isAfter(weekDates[0], "date") || logTimeUTC.isSame(weekDates[0], "date")) {
          // Because habit records were fetched with ascending order by LogTime, getting the start index should suffice
          startRecordIndex = i;
          break;
        }
      }
      console.log("startRecordIndex", startRecordIndex);

      // If found a start in dex, Loop through days of the week to try to find a record for a day
      if (startRecordIndex >= 0) {
        let currRecordIndex = startRecordIndex;
        for (let i = 0; i < 7; i++) {
          let isFoundLogOnCurrDay = false;
          if (currRecordIndex >= records.length) {
            break;
          }
          
          for (let j = currRecordIndex; j < records.length; j++) {
            let logTimeUTC = dayjs(records[j]['LogTime']).tz("GMT");
            if (logTimeUTC.isSame(weekDates[i], "date")) {
              isFoundLogOnCurrDay = true;
              currRecordIndex ++;
            } else {;
            }
          }

          if (isFoundLogOnCurrDay) {
            console.log("a record is found on this day", i);
            paddedRecords.push(true);
          } else {
            console.log("no record found on this day", i);
            paddedRecords.push(false);
          }
        }
      }
      
      // Finally pad the array up to 7
      if (paddedRecords.length < 7 || !paddedRecords) {
        while (paddedRecords.length < 7) {
          paddedRecords.push(false);
        }
      }

      return paddedRecords;
    });
    console.log("tmpLogBtnStates:", tmpLogBtnStates);
  }, [habits, weekDates]);

  useEffect(() => {
    // This effect is triggered on component load
    console.log("Now habits table is refreshed");
  }, []);

  return (
    <div>
      {isHabitsUpdFinished ? (
        habits.map((habit) => (
          <table className="table table-hover" key={habit.Hid}>
            <thead className="table-info" key={habit.Hid + "-header"}>
              <tr>
                <th style={{ width: "64%" }}>Habit</th>
                <th style={{ width: "12%" }}>Frequency</th>
                <th style={{ width: "12%" }}>Per</th>
                <th style={{ width: "12%" }}>Logged</th>
              </tr>
            </thead>

            <tbody className="table-primary">
              <tr>
                <td>{habit.HDscr}</td>
                <td>{habit.GoalFq}</td>
                {/* This is habit goal frequency type, W(eek) or M(onth) */}
                <td>{habit.GoalFqType}</td>
                {/* habit.records is habit records from HabitRecords table */}
                <td>{habit.records && habit.records.length} times</td>
              </tr>

              {/* Render habit.records if it exists */}
              {habit.records &&
                habit.records.map((record, index) => (
                  <tr key={record.Hid + index}>
                    <td>{index}</td>
                    <td colSpan={3}>{record.LogTime}</td>
                  </tr>
                ))}
            </tbody>

            <tfoot>
              <tr>
                <td className="table-primary" colSpan={4}>
                  <table className="table table-hover">
                    <tbody className="table-secondary">
                      <tr>
                        {weekDates.map((date, index) => (
                          <td key={index}>{date.format("MMM-DD")}</td>
                        ))}
                      </tr>
                      <tr>
                        {weekDates.map((date, index) => (
                          <td key={index + "-btn"}>
                            <button className={logBtnStates[index] ? "btn btn-success" : "btn btn-outline-secondary"} onClick={() => toggleLogOnDay(index, date, habit.Hid)}>Zzz</button>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tfoot>
          </table>
        ))
      ) : (
        <p>Updating habits...</p>
      )}
    </div>
  );
}

export default HabitsTable;
