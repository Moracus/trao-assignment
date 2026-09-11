import { useMemo, useState } from "react";
import DashboardLayout from ".././components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from ".././components/ui/Card";
import { Badge } from ".././components/ui/Badge";
import {
  AddRounded,
  ScheduleRounded,
  CheckCircleRounded,
  WorkOutlineRounded,
} from "@mui/icons-material";

import CreateKitModal from "../components/modals/CreateKitModal";
import Button from "../components/ui/Button";

const mockKits = [
  {
    id: 1,
    company: "Google",
    role: "Frontend Engineer",
    status: "completed",
    questions: 48,
    updated: "2h ago",
  },
  {
    id: 2,
    company: "Uber",
    role: "SDE-1",
    status: "progress",
    questions: 21,
    updated: "Yesterday",
  },
  {
    id: 3,
    company: "Atlassian",
    role: "Backend Engineer",
    status: "completed",
    questions: 36,
    updated: "3 days ago",
  },
  {
    id: 4,
    company: "Trao",
    role: "Software Engineer",
    status: "progress",
    questions: 14,
    updated: "5 min ago",
  },
  {
    id: 5,
    company: "Swiggy",
    role: "Full Stack",
    status: "completed",
    questions: 52,
    updated: "Last week",
  },
];

export default function Dashboard() {
  const [filter, setFilter] = useState("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const kits = useMemo(() => {
    if (filter === "progress")
      return mockKits.filter((k) => k.status === "progress");
    if (filter === "completed")
      return mockKits.filter((k) => k.status === "completed");
    return mockKits;
  }, [filter]);

  const completed = mockKits.filter((k) => k.status === "completed").length;
  const progress = mockKits.filter((k) => k.status === "progress").length;

  return (
    <DashboardLayout filter={filter} setFilter={setFilter}>
      <CreateKitModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onGenerate={(data) => console.log(data)}
      />
      <div className="space-y-6">
        {/* Hero */}
        <section className="rounded-3xl bg-accent p-8 text-bg">
          <p className="text-sm opacity-80">Welcome back</p>
          <h1 className="mt-2 text-3xl font-bold">Interview Kit Dashboard</h1>
          <p className="mt-3 max-w-2xl text-sm opacity-80">
            Generate tailored interview preparation kits, track progress, and
            revisit completed company-specific questions.
          </p>

          <Button
            className="mt-6 bg-bg text-text hover:bg-surface"
            onClick={() => setCreateModalOpen(true)}
          >
            <AddRounded fontSize="small" />
            New Interview Kit
          </Button>
        </section>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total Kits"
            value={mockKits.length}
            icon={<WorkOutlineRounded />}
          />
          <StatCard
            title="In Progress"
            value={progress}
            icon={<ScheduleRounded />}
          />
          <StatCard
            title="Completed"
            value={completed}
            icon={<CheckCircleRounded />}
          />
        </div>

        {/* Kits */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">My Kits</h2>
            <p className="text-sm text-muted">
              {kits.length} kit{kits.length !== 1 && "s"} found
            </p>
          </div>

          <Badge variant="outline">
            {filter === "all"
              ? "All"
              : filter === "progress"
                ? "In Progress"
                : "Completed"}
          </Badge>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {kits.map((kit) => (
            <KitCard key={kit.id} kit={kit} />
          ))}
        </div>

        {kits.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-14">
              <WorkOutlineRounded
                sx={{ fontSize: 44 }}
                className="text-muted"
              />
              <h3 className="mt-4 font-semibold">No kits found</h3>
              <p className="mt-1 text-sm text-muted">
                Try switching the sidebar filter.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-muted">{title}</p>
          <h3 className="mt-1 text-3xl font-bold">{value}</h3>
        </div>

        <div className="rounded-2xl bg-surface-2 p-3">{icon}</div>
      </CardContent>
    </Card>
  );
}

function KitCard({ kit }) {
  return (
    <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{kit.company}</CardTitle>
            <p className="mt-1 text-sm text-muted">{kit.role}</p>
          </div>

          <Badge variant={kit.status === "completed" ? "success" : "warning"}>
            {kit.status === "completed" ? "Completed" : "In Progress"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-5 flex items-center justify-between text-sm">
          <span className="text-muted">Questions</span>
          <span className="font-semibold">{kit.questions}</span>
        </div>

        <div className="mb-5 flex items-center justify-between text-sm">
          <span className="text-muted">Last Updated</span>
          <span>{kit.updated}</span>
        </div>

        <Button className="w-full" variant="outline">
          Open Kit
        </Button>
      </CardContent>
    </Card>
  );
}
