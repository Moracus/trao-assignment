import { Card, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import {
  ErrorRounded,
  RefreshRounded,
  DeleteRounded,
  BusinessRounded,
} from "@mui/icons-material";

export default function FailedKitCard({ kit, onDelete, onRegenerate }) {
  return (
    <Card className="border-red-200 dark:border-red-900/40">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-red-100 p-3 text-red-600 dark:bg-red-950/40 dark:text-red-400">
            <ErrorRounded />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <BusinessRounded className="text-muted" fontSize="small" />
              <h3 className="truncate text-lg font-semibold">{kit.company}</h3>
            </div>

            <div className="mt-2 inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
              Generation Failed
            </div>

            <p className="mt-3 text-sm text-muted">
              {kit.error ||
                "Something went wrong while generating this interview kit."}
            </p>

            <div className="mt-5 flex gap-3">
              <Button onClick={() => onRegenerate(kit._id)}>
                <RefreshRounded fontSize="small" />
                Regenerate
              </Button>

              <Button
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                onClick={() => onDelete(kit._id)}
              >
                <DeleteRounded fontSize="small" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
