import AddIcon from "@mui/icons-material/Add";

import QuestionCard from "../components/QuestionCard";

export default function QuestionsSection(builder) {
  const {
    groupedQuestions,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    duplicateQuestion,
    togglePin,
    changeCategory,
    moveQuestion
  } = builder;

  

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
          onClick={() => addQuestion("General")}
          className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
        >
          <AddIcon fontSize="small" />
          Add Question
        </button>
      </div>

      {Object.entries(groupedQuestions).map(([category, questions]) => (
        <section key={category}>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-400">
            {category}
          </h3>

          <div className="space-y-4">
            {questions.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                updateQuestion={updateQuestion}
                deleteQuestion={deleteQuestion}
                duplicateQuestion={duplicateQuestion}
                togglePin={togglePin}
                changeCategory={changeCategory}
                moveQuestion={moveQuestion}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
