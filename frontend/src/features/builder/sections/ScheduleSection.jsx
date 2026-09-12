import AddIcon from "@mui/icons-material/Add";
import ScheduleDayCard from "../components/ScheduleDayCard";

export default function ScheduleSection(builder) {
  const { kit, addScheduleDay, updateScheduleDay, deleteScheduleDay } = builder;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Study Schedule</h2>
          <p className="text-sm text-gray-500">
            Plan your interview prep across multiple days.
          </p>
        </div>

        <button
          onClick={addScheduleDay}
          className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
        >
          <AddIcon fontSize="small" />
          Add Day
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {kit?.schedule.days
          .sort((a, b) => a.day - b.day)
          .map((day) => (
            <ScheduleDayCard
              key={day.day}
              day={day}
              allQuestions={kit.questions}
              updateScheduleDay={updateScheduleDay}
              deleteScheduleDay={deleteScheduleDay}
            />
          ))}
      </div>
    </div>
  );
}
