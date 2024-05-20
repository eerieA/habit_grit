import React, { useState, useEffect } from "react";
import supabase from "./supabase.js";
import dayjs from "dayjs";

import { testUid, errorDupPrimaryKey } from './constants.js';

var utc = require("dayjs/plugin/utc");
var timezone = require("dayjs/plugin/timezone"); // dependent on utc plugin
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
  const [logBtnStates, setLogBtnStates] = useState({});

  const weekDates = getCurrentWeekDates();
  
  const toggleLogOnDay = async (index, date, hid) => {
    console.log("Passed in date:", date);
    console.log("date.unix():", date.unix());
    console.log("Passed in hid:", hid);

    let { data, error } = await supabase
      .from("HabitRecords")
      .insert([{ Hid: hid, LogTime: date }])
      .select();

    if (error) {
      if (error.code === errorDupPrimaryKey) {
        // This is code for duplicate primary key, i.e. the log exists. So toggle it off. i.e. delete.
        let { deleteError } = await supabase
          .from("HabitRecords")
          .delete()
          .eq("Hid", hid)
          .eq("LogTime", date);

        if (deleteError) {
          console.log("Error deleting habit record from Supabase:", deleteError);
        }

        // This means delete was successful. Refetch.
        refetchHabits(localUid || testUid);
      } else {
        // For other errors, print error content
        console.log("Error adding habit record to Supabase:", error);
      }

      return;
    }

    console.log("Response data:", data);
    // This means insert was successful. Refetch.
    refetchHabits(localUid || testUid);
  };

  const handleDeleteHabit = async (hid) => {
    console.log("Passed in hid is:", hid);

    let { error } = await supabase.from("Habits").delete().eq("Hid", hid);

    if (error) {      
      console.log("Error deleting habit from Supabase:", error);
      return;
    }

    console.log("Deletion of habit was successful.");
    // This means delete was successful. Refetch.
    refetchHabits(localUid || testUid);
  };

  useEffect(() => {
    console.log("[useEffect] logBtnStates:", logBtnStates);
  }, [logBtnStates]);

  useEffect(() => {
    // This effect is triggered whenever habits change

    // Update button states on habits refresh
    const weekDates = getCurrentWeekDates();
    const mapBtnStates = (habits) => {
      let tmpLogBtnStates = {};

      habits.forEach((habit) => {
        let records = habit.records;
        let paddedRecords = [];
        let startRecordIndex = -1;

        // Loop through records to try to find a record that is nearest and after the start of current week
        for (let i = 0; i < records.length; i++) {
          let logTimeUTC = dayjs(records[i]["LogTime"]).tz("GMT");
          if (logTimeUTC.isAfter(weekDates[0], "date") || logTimeUTC.isSame(weekDates[0], "date")) {
            // Because habit records were fetched with ascending order by LogTime, getting the start index should suffice
            startRecordIndex = i;
            break;
          }
        }

        // If found a start in dex, Loop through days of the week to try to find a record for a day
        if (startRecordIndex >= 0) {
          let currRecordIndex = startRecordIndex;
          for (let i = 0; i < 7; i++) {
            let isFoundLogOnCurrDay = false;
            if (currRecordIndex >= records.length) {
              break;
            }

            for (let j = currRecordIndex; j < records.length; j++) {
              let logTimeUTC = dayjs(records[j]["LogTime"]).tz("GMT");
              if (logTimeUTC.isSame(weekDates[i], "date")) {
                isFoundLogOnCurrDay = true;
                currRecordIndex++;
              } else {
              }
            }

            if (isFoundLogOnCurrDay) {
              // a record is found on this day, push true
              paddedRecords.push(true);
            } else {
              // a record is not found on this day, push false
              paddedRecords.push(false);
            }
          }
        }

        // Finally pad the array up to 7, either there are not enough records before end of week, or no records in this week
        if (paddedRecords.length < 7) {
          while (paddedRecords.length < 7) {
            paddedRecords.push(false);
          }
        }

        tmpLogBtnStates[habit.Hid] = paddedRecords;
      });

      setLogBtnStates(tmpLogBtnStates);
    };

    mapBtnStates(habits);
  }, [habits]);

  useEffect(() => {
    // This effect is triggered on component load
    console.log("Now habits table has refreshed.");
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
              <tr>
                <td colSpan={4}>
                  <LogHistory habit= {habit} />
                </td>
              </tr>
            </tbody>

            <tfoot>
              <tr>
                <td className="table-primary" colSpan={4}>
                  <table className="table table-hover">
                    <tbody className="table-success">
                      <tr>
                        {weekDates.map((date, index) => (
                          <td key={index}>{date.format("MMM-DD")}</td>
                        ))}
                      </tr>
                      <tr>
                        {weekDates.map((date, index) => (
                          <td key={index + "-btn"}>
                            {/* Make button based on if habit Hid in the matrix exist and button state is true */}
                            {/* Note that if habit Hid not exist there will be an error, so must check it */}
                            <button
                              className={
                                logBtnStates[habit.Hid] && logBtnStates[habit.Hid][index]
                                  ? "btn btn-success"
                                  : "btn btn-outline-secondary"
                              }
                              onClick={() => toggleLogOnDay(index, date, habit.Hid)}
                            >
                              {logBtnStates[habit.Hid] && logBtnStates[habit.Hid][index]
                                ? "Done"
                                : "Zzz"}
                            </button>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td className="table-primary" align="right" colSpan={4}>
                  <button className={"btn btn-dark"} onClick={() => handleDeleteHabit(habit.Hid)}>Delete Habit</button>
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


// Child component: log history table

function LogHistory({ habit }) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  
  // Function to convert UTC time to local time and format it
  const convertToLocalDate = (utcTimeString) => {
    const utcDateTime = new Date(utcTimeString);
    const localDate = utcDateTime.toLocaleDateString();
    return localDate;
  };

  // Function to toggle the visibility state
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (    
    <table className="table table-hover">
    <tbody className="table-info">
      <tr><td colSpan={4}>Log history <button className={"btn btn-group-lg"} onClick={toggleCollapse}>
        {isCollapsed ? '+' : '-'}
      </button>
      </td></tr>
      {!isCollapsed && habit.records && habit.records.map((record, index) => (
        <tr key={record.Hid + index}>
          <td>{index}</td>
          <td>{convertToLocalDate(record.LogTime)}</td>
        </tr>
      ))}
    </tbody>
  </table>
  );
}