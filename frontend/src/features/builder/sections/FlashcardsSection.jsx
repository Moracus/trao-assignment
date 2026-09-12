
import { AddOutlined } from "@mui/icons-material";
import FlashcardCard from "../components/FlashcardCard";

export default function FlashcardsSection(builder) {
  const {
    flashcards,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    saveState,
    regenerating = false,
  } = builder;

  if (regenerating) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-40 animate-pulse rounded-xl bg-slate-200" />
            <div className="mt-2 h-4 w-64 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="h-11 w-28 animate-pulse rounded-xl bg-slate-200" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border bg-white p-5">
              <div className="mb-4 h-6 w-24 animate-pulse rounded bg-slate-200" />
              <div className="space-y-4">
                <div className="h-6 animate-pulse rounded bg-slate-200" />
                <div className="h-20 animate-pulse rounded-xl bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Flashcards</h2>
          <p className="text-sm text-gray-500">
            Quick revision cards generated from your kit.
          </p>
        </div>

        <button
          onClick={createFlashcard}
          className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
        >
          <AddOutlined fontSize="small" />
          Add Card
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {flashcards.map((card) => (
          <FlashcardCard
            key={card.id}
            card={card}
            updateFlashcard={updateFlashcard}
            deleteFlashcard={deleteFlashcard}
            saveState={saveState}
          />
        ))}
      </div>
    </div>
  );
}