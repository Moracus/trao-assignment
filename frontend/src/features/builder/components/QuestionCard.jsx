import {
  ContentCopy,
  DeleteOutlineOutlined,
  KeyboardArrowDown,
  KeyboardArrowUp,
  PushPinOutlined,
} from "@mui/icons-material";
import EditableText from "./EditableText";
import SourceBadge from "./SourceBadge";

const categories = [
  "React",
  "Backend",
  "JavaScript",
  "DSA",
  "System Design",
  "Behavioral",
];

export default function QuestionCard({
  question,
  updateQuestion,
  deleteQuestion,
  duplicateQuestion,
  togglePin,
  changeCategory,
  moveQuestion
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 transition hover:shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-1">
          <button onClick={() => moveQuestion(question.id, "up")}>
            <KeyboardArrowUp fontSize="small" />
          </button>

          <button onClick={() => moveQuestion(question.id, "down")}>
            <KeyboardArrowDown fontSize="small" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <SourceBadge meta={question._meta} />

          <select
            value={question.category}
            onChange={(e) => changeCategory(question.id, e.target.value)}
            className="rounded-lg border px-2 py-1 text-xs"
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 text-gray-500">
          <button onClick={() => duplicateQuestion(question.id)}>
            <ContentCopy fontSize="small" />
          </button>

          <button onClick={() => togglePin(question.id)}>
            <PushPinOutlined
              fontSize="small"
              className={question._meta.pinned ? "text-purple-600" : ""}
            />
          </button>

          <button onClick={() => deleteQuestion(question.id)}>
            <DeleteOutlineOutlined fontSize="small" className="text-red-500" />
          </button>
        </div>
      </div>

      <EditableText
        value={question.prompt}
        onSave={(v) => updateQuestion(question.id, { prompt: v })}
        className="text-lg font-semibold"
      />

      <div className="mt-4 border-t pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Answer outline
        </p>

        <EditableText
          multiline
          value={question.answer}
          onSave={(v) => updateQuestion(question.id, { answer: v })}
          className="text-sm leading-6 text-gray-700"
        />
      </div>
    </div>
  );
}
