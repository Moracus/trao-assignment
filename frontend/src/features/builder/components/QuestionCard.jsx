import {
  DeleteOutlineOutlined,
  KeyboardArrowDown,
  KeyboardArrowUp,
  PushPinOutlined,
} from "@mui/icons-material";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import EditableText from "./EditableText";
import DragHandle from "./DragHandle";
import SourceBadge from "./SourceBadge";

const categories = [
  "technical",
  "behavioural",
  "system-design",
  "company-fit",
  "others",
];

export default function QuestionCard({
  question,
  updateQuestion,
  deleteQuestion,
  moveQuestion,
  reorderQuestions,
  saveState,
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: question.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDelete = () => {
    const confirmed = window.confirm("Delete this question?");
    if (confirmed) deleteQuestion(question.id);
  };

  const handleReorder = (direction) => {
    const currentCategory = question.category || "technical";
    const ordered = (question.parentQuestions ?? [])
      .filter((item) => item.category === currentCategory && !item.deleted)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((item) => item.id);

    const index = ordered.indexOf(question.id);
    if (index === -1) return;

    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= ordered.length) return;

    const next = [...ordered];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];

    reorderQuestions(currentCategory, next);
  };

  const moveToCategory = (nextCategory) => {
    if (nextCategory !== (question.category || "technical")) {
      moveQuestion(question.id, nextCategory);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-2xl border bg-white p-5 transition hover:shadow-sm"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-1">
          <DragHandle {...attributes} {...listeners} />
          <button onClick={() => handleReorder("up")} aria-label="Move question up">
            <KeyboardArrowUp fontSize="small" />
          </button>

          <button onClick={() => handleReorder("down")} aria-label="Move question down">
            <KeyboardArrowDown fontSize="small" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={question.category || "technical"}
            onChange={(e) => moveToCategory(e.target.value)}
            className="rounded-lg border px-2 py-1 text-xs"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 text-gray-500">
          <button onClick={() => updateQuestion(question.id, { pinned: !question.pinned })} aria-label="Toggle pin question">
            <PushPinOutlined
              fontSize="small"
              className={question.pinned ? "text-purple-600" : ""}
            />
          </button>

          <button onClick={handleDelete} aria-label="Delete question">
            <DeleteOutlineOutlined fontSize="small" className="text-red-500" />
          </button>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <EditableText
          value={question.prompt ?? ""}
          onSave={(v) => updateQuestion(question.id, { prompt: v })}
          className="text-lg font-semibold"
        />
        <SourceBadge
          meta={{
            pinned: question.pinned,
            source: question.generated === false ? "user" : "generated",
            edited: question.edited,
          }}
        />
      </div>

      <div className="mt-4 border-t pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Answer outline
        </p>

        <EditableText
          multiline
          value={question.answer_outline ?? question.answer ?? ""}
          onSave={(v) => updateQuestion(question.id, { answer_outline: v, answer: v })}
          className="text-sm leading-6 text-gray-700"
        />
      </div>

      {saveState === "saving" && (
        <div className="mt-3 text-xs text-gray-500">Saving...</div>
      )}
    </div>
  );
}
