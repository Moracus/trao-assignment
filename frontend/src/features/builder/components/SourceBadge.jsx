export default function SourceBadge({ meta = {} }) {
  const { pinned, source, edited } = meta;

  if (pinned)
    return (
      <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
        Pinned
      </span>
    );

  if (source === "user")
    return (
      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
        Added
      </span>
    );

  if (edited)
    return (
      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
        Edited
      </span>
    );

  return (
    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
      Generated
    </span>
  );
}