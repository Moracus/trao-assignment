import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import Button from "../../../components/ui/Button";

export default function RegenerateButton({ onClick }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} className="gap-2">
      <AutoAwesomeIcon fontSize="small" />
      Regenerate
    </Button>
  );
}
