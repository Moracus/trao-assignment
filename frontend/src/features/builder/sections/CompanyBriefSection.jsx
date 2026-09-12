import EditableText from "../components/EditableText";
import SourceBadge from "../components/SourceBadge";
import RegenerateButton from "../components/RegenerateButton";

export default function CompanyBriefSection({ brief, updateBrief }) {
  return (
    <div className="rounded-2xl border bg-white">
      <div className="flex items-center justify-between border-b p-5">
        <div>
          <div className="mb-2">
            <SourceBadge meta={brief._meta} />
          </div>

          <h2 className="text-2xl font-bold">Company Brief</h2>
        </div>

        <RegenerateButton onClick={() => console.log("regen")} />
      </div>

      <div className="space-y-8 p-6">
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Summary
          </p>

          <EditableText
            multiline
            value={brief.summary}
            onSave={(v) => updateBrief("summary", v)}
            className="text-base leading-7 text-gray-700"
          />
        </section>

        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Business Model
          </p>

          <EditableText
            multiline
            value={brief.businessModel}
            onSave={(v) => updateBrief("businessModel", v)}
            className="text-base leading-7 text-gray-700"
          />
        </section>

        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Culture
          </p>

          <EditableText
            multiline
            value={brief.culture}
            onSave={(v) => updateBrief("culture", v)}
            className="text-base leading-7 text-gray-700"
          />
        </section>
      </div>
    </div>
  );
}
