import supabase from "./supabase.js";
import dayjs from "dayjs";

function getCurrentWeekDates() {
  const startOfWeek = dayjs().startOf("week");
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const date = startOfWeek.add(i, "day");
    weekDates.push(date);
  }
  return weekDates;
}

function HabitsTable({ habits, isHabitsUpdFinished }) {
  const weekDates = getCurrentWeekDates();

  const toggleLogOnDay = async (date, hid) => {
    console.log("Passed in date:", date);
    console.log("Passed in hid:", hid);
    let { data, error } = await supabase
      .from('HabitRecords')
      .insert([
        { Hid: hid, LogTime: date },
      ])
      .select();

    if (error) {
      console.log('Error adding habit to Supabase:', error);
      if (error.code === '23505') {
        // This is code for duplicate primary key, i.e. the log exists. So toggle it off. i.e. delete.
        let { deleteError } = await supabase
          .from('HabitRecords')
          .delete()
          .eq('Hid', hid)
          .eq('LogTime', date);

        console.log('deleteError:', deleteError);
      }
      return;
    }

    console.log("Response data:", data);
  }

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
                          <td key={index + "-state"}>
                            <button className="btn btn-outline-secondary" onClick={() => toggleLogOnDay(date, habit.Hid)}>Zzz</button>
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
