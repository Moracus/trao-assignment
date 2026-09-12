import { CheckCircle, RadioButtonUnchecked } from "@mui/icons-material";

export default function CoverageSection({ kit }) {
  const requirements = kit?.role?.requirements ?? [];
  const questions = kit?.questions ?? [];

  const coveredIds = new Set(questions.flatMap((q) => q.requirement_ids));

  const covered = requirements.filter((r) => coveredIds.has(r.id));
  const uncovered = requirements.filter((r) => !coveredIds.has(r.id));

  const total = requirements.length;
  const percentage =
    total === 0 ? 0 : Math.round((covered.length / total) * 100);

  const getLinkedQuestions = (requirementId) =>
    questions.filter((q) => q.requirement_ids.includes(requirementId));

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="rounded-2xl border bg-white p-6">
        <h2 className="text-2xl font-bold">Coverage Report</h2>
        <p className="mt-1 text-sm text-gray-500">
          How well your current interview kit matches the job description.
        </p>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-medium">
              {covered.length} / {total} requirements covered
            </span>
            <span className="text-sm text-gray-500">{percentage}%</span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-black transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="mt-3 flex gap-4 text-sm">
            <span className="text-green-600">✓ {covered.length} Covered</span>
            <span className="text-amber-600">○ {uncovered.length} Missing</span>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="rounded-2xl border bg-white">
        <div className="border-b p-5">
          <h3 className="font-semibold">Requirement Breakdown</h3>
        </div>

        <div className="divide-y">
          {requirements.map((req) => {
            const isCovered = coveredIds.has(req.id);
            const linkedQuestions = getLinkedQuestions(req.id);

            return (
              <div key={req.id} className="p-5">
                <div className="flex items-start gap-3">
                  {isCovered ? (
                    <CheckCircle className="mt-0.5 text-green-600" />
                  ) : (
                    <RadioButtonUnchecked className="mt-0.5 text-gray-300" />
                  )}

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{req.text}</p>

                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          req.type === "must"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {req.type}
                      </span>
                    </div>

                    {isCovered ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {linkedQuestions.map((q) => (
                          <span
                            key={q.id}
                            className="rounded-full bg-gray-100 px-3 py-1 text-xs"
                          >
                            {q.prompt}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-amber-600">
                        No question currently covers this requirement.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
