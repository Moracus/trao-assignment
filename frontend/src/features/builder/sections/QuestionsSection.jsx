import AddIcon from "@mui/icons-material/Add";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";

import QuestionCard from "../components/QuestionCard";

export default function QuestionsSection(builder) {
  const {
    groupedQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    moveQuestion,
    reorderQuestions,
    saveState,
    questions,
    regenerating = false,
  } = builder;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;

    const sourceCategory = Object.keys(groupedQuestions).find((category) =>
      groupedQuestions[category].some((q) => q.id === active.id),
    );
    const targetCategory = Object.keys(groupedQuestions).find((category) =>
      groupedQuestions[category].some((q) => q.id === over.id),
    );

    if (!sourceCategory || !targetCategory) return;

    const original = [...groupedQuestions[sourceCategory]];
    const fromIndex = original.findIndex((q) => q.id === active.id);
    const toIndex = original.findIndex((q) => q.id === over.id);

    if (fromIndex < 0 || toIndex < 0) return;

    if (sourceCategory === targetCategory) {
      const reordered = arrayMove(original, fromIndex, toIndex).map((q) => q.id);
      reorderQuestions(sourceCategory, reordered);
      return;
    }

    const moved = original[fromIndex];
    moveQuestion(moved.id, targetCategory);
  };

  if (regenerating) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-52 animate-pulse rounded-xl bg-slate-200" />
            <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="h-11 w-32 animate-pulse rounded-xl bg-slate-200" />
        </div>

        <div className="space-y-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                <div className="h-8 w-20 animate-pulse rounded-lg bg-slate-200" />
              </div>
              <div className="h-6 w-3/4 animate-pulse rounded bg-slate-200" />
              <div className="mt-6 h-20 animate-pulse rounded-xl bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Interview Questions</h2>
          <p className="text-sm text-gray-500">
            Edit, organize and expand your interview kit.
          </p>
        </div>

        <button
          onClick={() => createQuestion("technical")}
          className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
        >
          <AddIcon fontSize="small" />
          New Question
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {Object.entries(groupedQuestions).map(([category, categoryQuestions]) => (
          <section key={category}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400">
                {category}
              </h3>
              {saveState && (
                <span className="text-xs text-gray-500">
                  {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : ""}
                </span>
              )}
            </div>

            <SortableContext items={categoryQuestions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {categoryQuestions.map((q) => (
                  <QuestionCard
                    key={q.id}
                    question={{ ...q, parentQuestions: questions }}
                    updateQuestion={updateQuestion}
                    deleteQuestion={deleteQuestion}
                    moveQuestion={moveQuestion}
                    reorderQuestions={reorderQuestions}
                    saveState={saveState}
                  />
                ))}
              </div>
            </SortableContext>
          </section>
        ))}
      </DndContext>
    </div>
  );
}
