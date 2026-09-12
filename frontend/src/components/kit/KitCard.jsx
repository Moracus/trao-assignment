import CardContent from "@mui/material/CardContent";
import { Badge } from "../ui/Badge";
import { Card, CardHeader, CardTitle } from "../ui/Card";
import Button from "../ui/Button";

function KitCard({ kit, onOpen, onRegenerate, onDelete }) {
  const localDate = new Date(kit?.updatedAt);

  return (
    <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{kit?.company || "Tech"}</CardTitle>
            <p className="mt-1 text-sm text-muted">{kit.role.title}</p>
          </div>

          <Badge variant={kit.status === "completed" ? "success" : "warning"}>
            {kit.status === "completed" ? "Completed" : "In Progress"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {/* Company brief */}
        {kit.company_brief?.summary && (
          <div className="mb-5 rounded-xl bg-surface p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              About the company
            </p>
            <p className="mt-1 text-sm leading-6 text-text line-clamp-3">
              {kit.company_brief.summary}
            </p>
          </div>
        )}

        <div className="mb-5 flex items-center justify-between text-sm">
          <span className="text-muted">Questions</span>
          <span className="font-semibold">{kit.questions?.length}</span>
        </div>

        <div className="mb-5 flex items-center justify-between text-sm">
          <span className="text-muted">Last Updated</span>
          <span>{localDate.toLocaleString()}</span>
        </div>

        <Button className="w-full" variant="outline" onClick={() => onOpen?.(kit._id)}>
          Open Kit
        </Button>

        <div className="mt-5 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onRegenerate(kit._id)}
          >
            Regenerate
          </Button>

          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => onDelete(kit._id)}
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default KitCard;
