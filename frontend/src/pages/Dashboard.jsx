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
import {
  connectKitEvents,
  createKit,
  deleteKit,
  getKit,
  getKits,
  regenerateKit,
} from "../api/kits";
import KitCard from "../components/kit/KitCard";
import GeneratingCard from "../components/kit/GeneratingCard";
import { useEffect } from "react";
import { useRef } from "react";
import FailedKitCard from "./FailedKitCard";

export default function Dashboard() {
  const [kits, setKits] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [progress, setProgress] = useState(0);
  const [completedKits, setCompletedKits] = useState(0);
  const [inProgressKits, setInProgressKits] = useState(0);

  const eventSources = useRef({});

  useEffect(() => {
    if (!kits) {
      loadKits();
    }
  }, [kits]);

  useEffect(() => {
    if (!kits?.length) return;

    kits.forEach((kit) => {
      if (kit.status === "completed") return;
      if (eventSources.current[kit._id]) return;

      const es = connectKitEvents(kit._id, async (data) => {
        if (data.status === "completed") {
          const realKit = await getKit(kit._id);
          setProgress(data.progress);

          setKits((prev) => prev.map((k) => (k._id === kit._id ? realKit : k)));

          es.close();
          delete eventSources.current[kit._id];
        } else {
          setProgress(data.progress);
          setKits((prev) =>
            prev.map((k) =>
              k._id === kit._id
                ? { ...k, progress: data.progress, status: data.status }
                : k,
            ),
          );
        }
      });

      eventSources.current[kit._id] = es;
    });
  }, [kits]);

  useEffect(() => {
    return () => {
      Object.values(eventSources.current).forEach((es) => es.close());
    };
  }, []);

  async function loadKits() {
    const data = await getKits();
    setKits(data);
  }

  async function handleGenerate(payload) {
    setCreateModalOpen(false);

    const tempId = `temp-${Date.now()}`;

    const optimistic = {
      _id: tempId,
      company: new URL(payload.companyUrl).hostname.replace("www.", ""),
      role: "Generating...",
      status: "progress",
      progress: 5,
    };

    setKits((prev) => [optimistic, ...(prev ?? [])]);

    try {
      const job = await createKit(payload);

      setKits((prev) =>
        prev?.map((k) =>
          k._id === tempId ? { ...k, _id: job._id, progress: 5 } : k,
        ),
      );
    } catch (err) {
      setKits((prev) => prev?.filter((k) => k._id !== tempId));
      console.error(err);
    }
  }

  async function deleteOne(id) {
    await deleteKit(id);
    setKits((prev) => prev?.length && prev.filter((k) => k._id !== id));
  }

  async function regenerate(id) {
    await regenerateKit(id);

    setKits(
      (prev) =>
        prev?.length &&
        prev.map((k) =>
          k._id === id ? { ...k, status: "generating", progress: 0 } : k,
        ),
    );
  }

  const filteredKits = useMemo(() => {
    const inProgressK =
      kits?.filter((k) => k.status !== "completed" && k.status !== "failed") ??
      [];
    const completedK = kits?.filter((k) => k.status === "completed") ?? [];
    setCompletedKits(completedK?.length);
    setInProgressKits(inProgressK?.length);

    if (filter === "progress") return inProgressKits;
    if (filter === "completed") return completedKits;
    return kits ?? [];
  }, [kits, filter]);

  return (
    <DashboardLayout filter={filter} setFilter={setFilter}>
      <CreateKitModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onGenerate={(data) => handleGenerate(data)}
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
            value={kits?.length ? kits?.length : 0}
            icon={<WorkOutlineRounded />}
          />
          <StatCard
            title="In Progress"
            value={inProgressKits}
            icon={<ScheduleRounded />}
          />
          <StatCard
            title="Completed"
            value={completedKits}
            icon={<CheckCircleRounded />}
          />
        </div>

        {/* Kits */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">My Kits</h2>
            <p className="text-sm text-muted">
              {kits?.length} kit{kits?.length !== 1 && "s"} found
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
          {filteredKits?.map((kit) =>
            kit.status === "completed" ? (
              <KitCard
                key={kit._id}
                kit={kit}
                onDelete={deleteOne}
                onRegenerate={regenerate}
              />
            ) : kit.status === "failed" ? (
              <FailedKitCard
                key={kit._id}
                kit={kit}
                onDelete={deleteOne}
                onRegenerate={regenerate}
              />
            ) : (
              <GeneratingCard
                key={kit._id}
                status={kit.status}
                company={kit.company}
                progress={kit.progress}
              />
            ),
          )}
        </div>

        {filteredKits?.length === 0 && (
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
