import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import Button from "../../../components/ui/Button";

export default function RegenerateButton({ onClick, loading = false, disabled = false, cooldownRemaining = 0 }) {
  const isCoolingDown = cooldownRemaining > 0 && !loading;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={loading || disabled || isCoolingDown}
      className="gap-2 whitespace-nowrap"
    >
      <AutoAwesomeIcon fontSize="small" className={loading ? "animate-spin" : ""} />
      {loading ? "Regenerating..." : isCoolingDown ? `Cooldown ${Math.ceil(cooldownRemaining / 1000)}s` : "Regenerate"}
    </Button>
  );
}
