import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import Button from "../../../components/ui/Button";

export default function RegenerateButton({ onClick, loading = false }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={loading} className="gap-2">
      <AutoAwesomeIcon fontSize="small" className={loading ? "animate-spin" : ""} />
      {loading ? "Regenerating..." : "Regenerate"}
    </Button>
  );
}
