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
  cooldownRemaining = 0,
}) {
  const navigate = useNavigate();
  const isCoolingDown = cooldownRemaining > 0 && !regenerating;

  return (
    <div className="flex flex-col gap-3 border-b bg-white px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <p className="text-sm text-gray-500">Interview Kit Builder</p>

        <div className="mt-1 flex items-center gap-3">
          <h1 className="truncate text-xl font-bold sm:text-2xl">
            {kit?.company} · {kit?.role?.title}
          </h1>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <CloudDoneIcon
            sx={{ fontSize: 18 }}
            className={dirty ? "text-amber-500" : "text-green-600"}
          />

          <span className="text-sm text-gray-600">
            {dirty ? "Unsaved changes" : "All changes saved"}
          </span>

          {isCoolingDown && (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
              Cooldown {Math.ceil(cooldownRemaining / 1000)}s
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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
            className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200 transition"
          >
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-600" />
            Regenerating...
          </button>
        ) : null}

        <button
          type="button"
          onClick={onFullKitRegenerate}
          disabled={regenerating || isCoolingDown}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Full kit
        </button>

        <RegenerateButton
          onClick={onRegenerate}
          loading={regenerating}
          cooldownRemaining={cooldownRemaining}
        />
      </div>
    </div>
  );
}
