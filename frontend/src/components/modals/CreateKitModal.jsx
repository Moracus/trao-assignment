import { useState } from "react";
import { CloseRounded } from "@mui/icons-material";
import Button  from ".././ui/Button";
import  {Card}  from ".././ui/Card";
import Input  from ".././ui/Input";

export default function CreateKitModal({ open, onClose, onGenerate }) {
  const [companyUrl, setCompanyUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [days, setDays] = useState(7);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    onGenerate?.({
      companyUrl,
      jobDescription,
      daysAvailable: days,
    });

    setCompanyUrl("");
    setJobDescription("");
    setDays(7);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl bg-surface">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border p-6">
            <div>
              <h2 className="text-xl font-semibold">Create Interview Kit</h2>
              <p className="mt-1 text-sm text-muted">
                Generate a personalized preparation roadmap.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 transition hover:bg-surface-2"
            >
              <CloseRounded />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-5 p-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Company URL</label>
              <Input
                placeholder="https://careers.company.com/job/123"
                value={companyUrl}
                onChange={(e) => setCompanyUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Job Description</label>
              <textarea
                rows={6}
                placeholder="Paste the complete job description..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full resize-none rounded-xl border border-border bg-bg px-4 py-3 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Days Available</label>
                <span className="rounded-lg bg-surface-2 px-3 py-1 text-sm font-semibold">
                  {days} days
                </span>
              </div>

              <input
                type="range"
                min={1}
                max={30}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-surface-2 accent-black dark:accent-white"
              />

              <div className="flex justify-between text-xs text-muted">
                <span>1</span>
                <span>30</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border p-6">
            <Button type="submit" className="w-full">
              Generate Interview Kit
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}