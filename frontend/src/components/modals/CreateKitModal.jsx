import { useMemo, useState } from "react";
import { CloseRounded } from "@mui/icons-material";
import { toast } from "react-toastify";
import Button from ".././ui/Button";
import { Card } from ".././ui/Card";
import Input from ".././ui/Input";
import { sanitizeCompanyUrl } from "../../utils/companyUrl";

export default function CreateKitModal({ open, onClose, onGenerate }) {
  const [companyUrl, setCompanyUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [days, setDays] = useState(7);
  const [error, setError] = useState("");

  const normalizedUrl = useMemo(() => sanitizeCompanyUrl(companyUrl), [companyUrl]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedJobDescription = jobDescription.trim();

    if (!trimmedJobDescription) {
      const message = "Please paste the job description before generating a kit.";
      setError(message);
      toast.error(message);
      return;
    }

    const sanitized = sanitizeCompanyUrl(companyUrl);

    if (!sanitized.ok) {
      setError(sanitized.message);
      toast.error(sanitized.message);
      return;
    }

    setError("");

    onGenerate?.({
      companyUrl: sanitized.value,
      jobDescription: trimmedJobDescription,
      daysAvailable: days,
    });

    setCompanyUrl("");
    setJobDescription("");
    setDays(7);
    setError("");
    onClose();
  };

  const handleUrlChange = (nextValue) => {
    setCompanyUrl(nextValue);
    if (error) setError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl bg-surface">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between border-b border-border p-6">
            <div>
              <h2 className="text-xl font-semibold">Create Interview Kit</h2>
              <p className="mt-1 text-sm text-muted">
                Generate a personalized preparation roadmap.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setError("");
                onClose();
              }}
              className="rounded-lg p-2 transition hover:bg-surface-2"
            >
              <CloseRounded />
            </button>
          </div>

          <div className="space-y-5 p-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Company URL</label>
              <Input
                placeholder="https://careers.company.com/job/123"
                value={companyUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                aria-invalid={Boolean(error && !normalizedUrl.ok)}
              />
              {companyUrl && !normalizedUrl.ok && (
                <p className="text-xs text-red-500">{normalizedUrl.message}</p>
              )}
              {error && <p className="text-xs text-red-500">{error}</p>}
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