import React, { useState, useEffect } from "react";
import supabase from "./supabase.js";
import dayjs from "dayjs";
import Plot from 'react-plotly.js';

import { testUid, errorDupPrimaryKey } from './constants.js';

var utc = require("dayjs/plugin/utc");
var timezone = require("dayjs/plugin/timezone"); // dependent on utc plugin
dayjs.extend(utc);
dayjs.extend(timezone);

function getCurrentWeekDates() {
  const startOfWeek = dayjs().startOf("week");
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    let date = startOfWeek.add(i, "day");
    weekDates.push(date);
  }
  return weekDates;
}

function getLastNDays(n) {
  let dates = [];

  // Get the start of today and convert to UTC with Dayjs, just to keep time format consistent
  // if need to set to 00:00, use dayjs().utc().startOf('day').tz("Etc/UTC")
  let currentDate = dayjs().utc().tz("Etc/UTC");

  // Loop to create the Dayjs objects for the last n days
  for (let i = 0; i < n; i++) {
      // Create a new Dayjs object representing n - i days before the current date
      // n - i because we want them to be arranged in ascending order
      let pastDate = currentDate.subtract(n - i, 'day');      
      dates.push(pastDate);
  }

  return dates;
}

/**
 * Converts a UTC time string to a local date string with an optional year.
 * 
 * @param {string} utcTimeString - The UTC time string to convert.
 * @param {boolean} keepYear - Whether to include the year in the output.
 * @returns {string} - The formatted local date string.
 */
function convertToLocalDate(utcTimeString, keepYear) {
  const utcDateTime = new Date(utcTimeString);
  
  const options = {
    month: 'short',
    day: 'numeric'
  };

  // Append option based on keepYear
  if (keepYear) {
    options.year = 'numeric';
  }

  const formatter = new Intl.DateTimeFormat('en-US', options);
  const localDate = formatter.format(utcDateTime);
  
  return localDate;
}

function HabitsTable({ habits, localUid, isHabitsUpdFinished, refetchHabits }) {
  const [logBtnStates, setLogBtnStates] = useState({});

  const weekDates = getCurrentWeekDates();
  
  const toggleLogOnDay = async (index, date, hid) => {

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

    // This means insert was successful. Refetch.
    refetchHabits(localUid || testUid);
  };

  const handleDeleteHabit = async (hid) => {

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
    console.log("Habits table is loaded.");
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

  const pastDates = getLastNDays(50);

  // Map them into date strings for y axis data
  const pastDateStrings = pastDates.map(date => date.format('YYYY-MM-DD'));

  // Map them into bools for x axis data
  const recordDates = habit.records.map(record => dayjs.utc(record.LogTime).startOf('day').tz("Etc/UTC"));
  const recordOnDate = pastDates.map(pastDate =>
    recordDates.some(recordDate => recordDate.isSame(pastDate, 'day'))
  );
  
  // Package x and y axis data into one object for passing along
  let LogData = {
    x: pastDateStrings,
    y: recordOnDate
  }
  
  // Function to toggle the visibility state
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (    
    <table className="table table-hover">
    <tbody className="table-info">
      <tr>
        <td colSpan={4}>Log history (50 days prior) <button className={"btn btn-group-lg"} onClick={toggleCollapse}>
        {isCollapsed ? '+' : '-'}
        </button>
        </td>
      </tr>
      {!isCollapsed ? (        
        <tr>
          <td colSpan={4}>
            <div className="chart-container">
            <ChartHabitLog logData= {LogData}/>
            </div>
          </td>
        </tr>
        ) : (<></>)}
      {/* Commenting out log as list, bcz it might get too long
      {!isCollapsed && habit.records && habit.records.map((record, index) => (
        <tr key={record.Hid + index}>
          <td>{index}</td>
          <td>{convertToLocalDate(record.LogTime)}</td>
        </tr>
      ))}
      */}
    </tbody>
  </table>
  );
}

// Child component: log history chart

function ChartHabitLog({ logData }) {
  const localDateX = logData.x.map(value => convertToLocalDate(value, false));
  const numericY = logData.y.map(value => value ? 1 : 0);
  const textY = logData.y.map(value => value ? "Done" : "zzz");

  return (
    <Plot
      data={[
        {
        type: "bar",
        x: localDateX, y: numericY,
        text: textY.map(String),
        textfont: {
          color: '#444',
        },
        marker: {
          color: '#31C6D4',
        }
        }
      ]}
      layout={{
        //title: "History",
        margin: {
          l: 2,
          r: 2,
          b: 24,
          t: 2,
          pad: 0,
        },
        xaxis: {
          type: 'category', // Treat x-axis values as date
          nticks: 8, // Specify the desired number of ticks on the x-axis
          tickfont: {
            size: 12
          },
          gridcolor: 'rgba(0, 0, 0, 0)', // Set the color of the gridlines to transparent
        },
        yaxis: {
          type: 'linear',
          tickformat: 'd', // Integer format for y-axis labels; not usful because it can be zoomed?
          range: [0, 1], // Set the range of y-axis
          gridcolor: 'rgba(0, 0, 0, 0)', // Set the color of the gridlines
          zerolinecolor: 'rgba(0.5, 0.5, 0.5, 0.33)', // Set the color of the y axis zero line
        },
        plot_bgcolor: 'rgba(0,0,0,0)', // Set plot background to transparent
        paper_bgcolor: 'rgba(0,0,0,0)' // Set paper background to transparent
      }}
      useResizeHandler={true}
      style={{ width: "100%", height: "100%" }}
    />
  );
}