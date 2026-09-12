import { useNavigate } from "react-router-dom";
import CloudDoneIcon from "@mui/icons-material/CloudDone";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import RegenerateButton from "./components/RegenerateButton";

export default function BuilderHeader({
  kit,
  dirty,
  regenerating = false,
  onRegenerate,
  onFullKitRegenerate,
}) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between border-b bg-white px-6 py-4">
      <div>
        <p className="text-sm text-gray-500">Interview Kit Builder</p>

        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-2xl font-bold">
            {kit?.company} · {kit?.role?.title}
          </h1>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <CloudDoneIcon
            sx={{ fontSize: 18 }}
            className={dirty ? "text-amber-500" : "text-green-600"}
          />

          <span className="text-sm text-gray-600">
            {dirty ? "Unsaved changes" : "All changes saved"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <HomeRoundedIcon fontSize="small" />
          Dashboard
        </button>

        {regenerating ? (
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200 transition hover:bg-amber-200"
          >
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-600" />
            Regenerating...
          </button>
        ) : null}

        <button
          type="button"
          onClick={onFullKitRegenerate}
          disabled={regenerating}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Full kit
        </button>

        <RegenerateButton onClick={onRegenerate} loading={regenerating} />
      </div>
    </div>
  );
}
