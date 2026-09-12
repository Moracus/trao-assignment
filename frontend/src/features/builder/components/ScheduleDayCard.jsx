import { DeleteOutlineOutlined } from "@mui/icons-material";
import EditableText from "./EditableText";

export default function ScheduleDayCard({
  day,
  allQuestions,
  updateScheduleDay,
  deleteScheduleDay,
}) {
  const toggleQuestion = (id) => {
    const exists = day.questions.includes(id);

    updateScheduleDay(day.day, {
      questions: exists
        ? day.questions.filter((q) => q !== id)
        : [...day.questions, id],
    });
  };

  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Day {day.day}
          </p>

          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              value={day.minutes}
              onChange={(e) =>
                updateScheduleDay(day.day, {
                  duration: Number(e.target.value),
                })
              }
              className="w-20 rounded-lg border px-2 py-1 text-center"
            />

            <span className="text-sm text-gray-500">mins</span>
          </div>
        </div>

        <button onClick={() => deleteScheduleDay(day.day)}>
          <DeleteOutlineOutlined className="text-red-500" />
        </button>
      </div>

      <div className="mb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Focus
        </p>

        <EditableText
          value={day.focus}
          placeholder="React fundamentals..."
          onSave={(v) => updateScheduleDay(day.day, { focus: v })}
          className="text-lg font-semibold"
        />
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Practice Questions
        </p>

        <div className="space-y-2">
          {allQuestions.map((q) => (
            <label
              key={q.id}
              className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={day.question_ids.includes(q.id)}
                onChange={() => toggleQuestion(q.id)}
                className="mt-1"
              />

              <div>
                <p className="text-sm font-medium">{q.prompt}</p>
                <p className="text-xs text-gray-500">{q.category}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
