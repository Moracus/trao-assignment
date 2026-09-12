import { DeleteOutlineOutlined } from "@mui/icons-material";
import EditableText from "./EditableText";
import SourceBadge from "./SourceBadge";

export default function FlashcardCard({
  card,
  updateFlashcard,
  deleteFlashcard,
  saveState,
}) {
  const handleDelete = () => {
    const confirmed = window.confirm("Delete this flashcard?");
    if (confirmed) deleteFlashcard(card.id);
  };

  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <SourceBadge
          meta={{
            pinned: card.pinned,
            source: card.generated === false ? "user" : "generated",
            edited: card.edited,
          }}
        />

        <div className="flex gap-1">
          <button onClick={handleDelete} aria-label="Delete flashcard">
            <DeleteOutlineOutlined fontSize="small" className="text-red-500" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Front
          </p>

          <EditableText
            value={card.front ?? ""}
            placeholder="Question..."
            onSave={(v) => updateFlashcard(card.id, { front: v })}
            className="text-lg font-semibold"
          />
        </div>

        <div className="border-t pt-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Back
          </p>

          <EditableText
            multiline
            value={card.back ?? ""}
            placeholder="Answer..."
            onSave={(v) => updateFlashcard(card.id, { back: v })}
            className="text-sm leading-6 text-gray-700"
          />
        </div>
      </div>

      {saveState === "saving" && (
        <div className="mt-3 text-xs text-gray-500">Saving...</div>
      )}
    </div>
  );
}
