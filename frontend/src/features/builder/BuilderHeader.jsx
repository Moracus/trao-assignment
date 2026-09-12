import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CloudDoneIcon from "@mui/icons-material/CloudDone";
import Button from "../../components/ui/Button";

export default function BuilderHeader({ kit, dirty }) {
  return (
    <div className="flex items-center justify-between border-b bg-white px-6 py-4">
      <div>
        <p className="text-sm text-gray-500">Interview Kit Builder</p>

        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-2xl font-bold">
            {kit.company} · {kit.role}
          </h1>

        </div>
          <div className="flex items-center gap-2">
            <CloudDoneIcon
              sx={{ fontSize: 18 }}
              className={dirty ? "text-amber-500" : "text-green-600"}
            />

            <span className="text-sm text-gray-600">
              {dirty ? "Unsaved changes" : "All changes saved"}
            </span>
          </div>
      </div>

      <Button className="gap-2">
        <AutoAwesomeIcon fontSize="small" />
        Regenerate
      </Button>
    </div>
  );
}
