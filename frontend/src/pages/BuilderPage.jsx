import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { connectKitEvents, getKit, regenerateKit } from "../api/kits";
import BuilderLayout from "../features/builder/BuilderLayout";
import useBuilder, {
  mergeCompanyBrief,
  mergeGeneratedSection,
} from "../features/builder/hooks/useBuilder";
import CompanyBriefSection from "../features/builder/sections/CompanyBriefSection";
import CoverageSection from "../features/builder/sections/CoverageSection";
import FlashcardsSection from "../features/builder/sections/FlashcardsSection";
import QuestionsSection from "../features/builder/sections/QuestionsSection";
import ScheduleSection from "../features/builder/sections/ScheduleSection";

const emptyKit = {
  id: null,
  questions: [],
  flashcards: [],
  companyBrief: {
    summary: "",
    what_they_do: "",
    sources: [],
    edited: { summary: false, what_they_do: false },
    pinned: false,
  },
  company_brief: {
    summary: "",
    what_they_do: "",
    sources: [],
    edited: { summary: false, what_they_do: false },
    pinned: false,
  },
};

const normalizeBuilderSection = (section) =>
  section === "brief" ? "companyBrief" : section;
const BUILDER_REGEN_STORAGE_KEY = "builder-regeneration-state";
const REGEN_COOLDOWN_MS = 5000;

const readStoredBuilderState = (kitId) => {
  try {
    const raw = localStorage.getItem(BUILDER_REGEN_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};

    const kitState = parsed[kitId] ?? {};
    return kitState;
  } catch {
    return {};
  }
};

const writeStoredBuilderState = (kitId, state) => {
  try {
    const raw = localStorage.getItem(BUILDER_REGEN_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[kitId] = {
      ...(parsed[kitId] ?? {}),
      ...state,
    };
    localStorage.setItem(BUILDER_REGEN_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore localStorage errors
  }
};

const applySectionResult = (current, section, payload) => {
  const next = { ...(current ?? emptyKit) };
  const result = payload?.result ?? payload ?? {};

  if (!section || !result) return next;

  if (section === "questions") {
    const questions = Array.isArray(result.questions) ? result.questions : [];
    next.questions = mergeGeneratedSection(current?.questions ?? [], questions);
  }

  if (section === "flashcards") {
    const flashcards = Array.isArray(result.flashcards)
      ? result.flashcards
      : [];
    next.flashcards = mergeGeneratedSection(
      current?.flashcards ?? [],
      flashcards,
    );
  }

  if (section === "companyBrief") {
    const incoming = result.company_brief ?? result.companyBrief ?? {};
    const merged = mergeCompanyBrief(
      current?.company_brief ?? current?.companyBrief ?? {},
      incoming,
    );
    next.company_brief = merged;
    next.companyBrief = merged;
  }

  if (section === "schedule") {
    next.schedule = result.schedule ?? current?.schedule ?? {};
  }

  if (section === "coverage") {
    next.coverage = {
      ...(current?.coverage ?? {}),
      ...(result.coverage ?? {}),
    };
  }

  return next;
};

export default function BuilderPage() {
  const { kitId } = useParams();
  const [kitData, setKitData] = useState(emptyKit);
  const [activeSection, setActiveSection] = useState("brief");
  const [regeneratingSection, setRegeneratingSection] = useState(null);
  const [cooldownUntil, setCooldownUntil] = useState(() => {
    const stored = readStoredBuilderState(kitId);
    return stored.cooldownUntil ?? 0;
  });
  const [now, setNow] = useState(Date.now());
  const eventSourceRef = useRef(null);

  const refreshKit = async () => {
    if (!kitId) return;

    try {
      const data = await getKit(kitId);
      setKitData(data ?? emptyKit);
    } catch (error) {
      console.error("Failed to load kit for builder", error);
      setKitData(emptyKit);
    }
  };

  useEffect(() => {
    if (!kitId) return;

    const stored = readStoredBuilderState(kitId);
    if (stored.activeSection) setActiveSection(stored.activeSection);
    if (stored.regeneratingSection)
      setRegeneratingSection(stored.regeneratingSection);
    if (stored.cooldownUntil) setCooldownUntil(stored.cooldownUntil);

    refreshKit();
  }, [kitId]);

  useEffect(() => {
    if (!cooldownUntil) return undefined;

    const tick = () => setNow(Date.now());
    tick();

    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [cooldownUntil]);

  useEffect(() => {
    if (!kitId) return;
    writeStoredBuilderState(kitId, {
      activeSection,
      regeneratingSection,
      cooldownUntil,
    });
  }, [kitId, activeSection, regeneratingSection, cooldownUntil]);

  useEffect(() => {
    if (!kitId) return;

    const es = connectKitEvents(kitId, async (payload) => {
      if (!payload || payload._id !== kitId) return;

      const payloadSection = normalizeBuilderSection(payload.section ?? "");
      const currentSection = normalizeBuilderSection(activeSection);

      if (payloadSection && payloadSection === currentSection) {
        const nextState =
          payload.status === "completed" ? null : payloadSection;
        setRegeneratingSection(nextState);
        writeStoredBuilderState(kitId, { regeneratingSection: nextState });
      }

      if (payload.status === "completed" && payloadSection === currentSection) {
        setKitData((current) =>
          applySectionResult(
            current,
            payloadSection,
            payload.data || payload.result || payload,
          ),
        );
        setRegeneratingSection(null);
        setCooldownUntil(Date.now() + REGEN_COOLDOWN_MS);
        writeStoredBuilderState(kitId, {
          regeneratingSection: null,
          cooldownUntil: Date.now() + REGEN_COOLDOWN_MS,
        });
        toast.success(
          `${payloadSection === "companyBrief" ? "Company brief" : payloadSection} regenerated successfully.`,
        );
      }

      if (payload.status === "failed") {
        setRegeneratingSection(null);
        writeStoredBuilderState(kitId, { regeneratingSection: null });
        if (payloadSection === "companyBrief") {
          toast.error(
            `Company Brief are not meant to regenerate, you can edt or regenerate the full kit.`,
          );
        }else{
          console.log(payloadSection)
          toast.error(
          `Regeneration failed for ${payloadSection || "this section"}. You can retry or regenerate the full kit.`,
        );
        }
        
      }
    });

    eventSourceRef.current = es;

    return () => es.close();
  }, [kitId, activeSection]);

  const isWithinCooldown = now < cooldownUntil;
  const cooldownRemaining = Math.max(0, cooldownUntil - now);

  const handleRegenerate = async (fallbackFullKit = false) => {
    if (!kitId) return;
    const section = normalizeBuilderSection(activeSection);

    if (regeneratingSection) {
      toast.info(
        `A ${regeneratingSection} regeneration is already in progress.`,
      );
      return;
    }

    if (isWithinCooldown) {
      toast.info(
        "Please wait a moment before regenerating this section again.",
      );
      return;
    }

    if (fallbackFullKit) {
      const confirmed = window.confirm(
        "Regenerate the full kit? This will refresh the full Builder content.",
      );
      if (!confirmed) return;
    }

    setRegeneratingSection(fallbackFullKit ? "full" : section);
    writeStoredBuilderState(kitId, {
      regeneratingSection: fallbackFullKit ? "full" : section,
    });

    try {
      await regenerateKit(kitId, fallbackFullKit ? "full" : section);
      toast.info(
        fallbackFullKit
          ? "Full kit regeneration queued."
          : `${section} regeneration queued.`,
      );
    } catch (error) {
      console.error("Failed to regenerate kit", error);
      setRegeneratingSection(null);
      writeStoredBuilderState(kitId, { regeneratingSection: null });
      toast.error(
        "Regeneration could not start. Try again or regenerate the full kit.",
        {
          autoClose: 6000,
          closeOnClick: false,
        },
      );
    }
  };

  const builder = useBuilder(kitData, kitId);
  const isRegenerating = Boolean(regeneratingSection);

  return (
    <BuilderLayout
      kit={{ ...emptyKit, ...kitData, ...builder.kit, cooldownRemaining }}
      kitId={kitId}
      dirty={builder.dirty}
      regenerating={isRegenerating}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      onRegenerate={() => handleRegenerate(false)}
      onFullKitRegenerate={() => handleRegenerate(true)}
    >
      {(section) => {
        if (section === "brief") {
          return (
            <CompanyBriefSection
              brief={builder.companyBrief}
              updateBrief={builder.updateCompanyBrief}
              saveState={builder.saveState}
              regenerating={
                isRegenerating && regeneratingSection === "companyBrief"
              }
            />
          );
        }

        if (section === "questions") {
          return (
            <QuestionsSection
              {...builder}
              regenerating={
                isRegenerating && regeneratingSection === "questions"
              }
            />
          );
        }

        if (section === "flashcards") {
          return (
            <FlashcardsSection
              {...builder}
              regenerating={
                isRegenerating && regeneratingSection === "flashcards"
              }
            />
          );
        }
        if (section === "schedule") {
          return (
            <ScheduleSection
              {...builder}
              regenerating={
                isRegenerating && regeneratingSection === "schedule"
              }
            />
          );
        }
        if (section === "coverage") {
          return (
            <CoverageSection
              {...builder}
              regenerating={
                isRegenerating && regeneratingSection === "coverage"
              }
            />
          );
        }

        return <div>Coming soon</div>;
      }}
    </BuilderLayout>
  );
}
