import EditableText from "../components/EditableText";
import SourceBadge from "../components/SourceBadge";

export default function CompanyBriefSection({ brief, updateBrief, saveState, regenerating = false }) {
  const statusLabel = saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : "";

  if (regenerating) {
    return (
      <div className="rounded-2xl border bg-white p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="h-8 w-52 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200" />
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
            <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
          </div>
          <div className="space-y-3">
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
            <div className="h-20 animate-pulse rounded-2xl bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white">
      <div className="flex items-center justify-between border-b p-5">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Company Brief</h2>
          <SourceBadge meta={{ pinned: brief?.pinned, source: "generated", edited: brief?.edited?.summary || brief?.edited?.what_they_do }} />
        </div>
        {statusLabel && (
          <span className="text-xs font-medium text-gray-500">{statusLabel}</span>
        )}
      </div>

      <div className="space-y-8 p-6">
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Summary
          </p>

          <EditableText
            multiline
            value={brief?.summary ?? ""}
            onSave={(v) => updateBrief("summary", v)}
            className="text-base leading-7 text-gray-700"
          />
        </section>

        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            What they do
          </p>

          <EditableText
            multiline
            value={brief?.what_they_do ?? ""}
            onSave={(v) => updateBrief("what_they_do", v)}
            className="text-base leading-7 text-gray-700"
          />
        </section>
      </div>
    </div>
  );
}
