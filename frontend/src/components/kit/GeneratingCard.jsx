import { Card, CardContent } from "../ui/Card";


export default function GeneratingCard({ company, progress }) {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div>
          <h3 className="font-semibold">{company || "Generating Kit"}</h3>
          <p className="text-sm text-muted">Analyzing job description...</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>{progress}%</span>
            <span className="text-muted">Generating</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}