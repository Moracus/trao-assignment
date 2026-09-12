import { useEffect, useMemo, useRef, useState } from "react";
import useDebounce from "../../../hooks/useDebounce";
import {
  createFlashcard as apiCreateFlashcard,
  createQuestion as apiCreateQuestion,
  deleteFlashcard as apiDeleteFlashcard,
  deleteQuestion as apiDeleteQuestion,
  moveQuestion as apiMoveQuestion,
  reorderQuestions as apiReorderQuestions,
  updateCompanyBrief as apiUpdateCompanyBrief,
  updateFlashcard as apiUpdateFlashcard,
  updateQuestion as apiUpdateQuestion,
} from "../../../api/kits";
import type {
  BuilderFlashcard,
  BuilderQuestion,
  CompanyBrief,
  QuestionCategory,
} from "../../../types/builder";

type KitLike = {
  id?: string;
  questions?: BuilderQuestion[];
  flashcards?: BuilderFlashcard[];
  companyBrief?: CompanyBrief;
  company_brief?: CompanyBrief;
  status?: string;
};

const normaliseQuestion = (question: any): BuilderQuestion => {
  const meta = question?._meta ?? {};
  return {
    ...question,
    id: question.id,
    category: (question.category ?? "technical") as QuestionCategory,
    prompt: question.prompt ?? "",
    answer_outline: question.answer_outline ?? question.answer ?? "",
    answer: question.answer_outline ?? question.answer ?? "",
    requirement_ids: question.requirement_ids ?? [],
    difficulty: question.difficulty ?? 1,
    generated: question.generated ?? (meta.source === "user" ? false : true),
    edited: question.edited ?? meta.edited ?? false,
    pinned: question.pinned ?? meta.pinned ?? false,
    deleted: !!question.deleted,
    order: question.order ?? 1000,
  };
};

const normaliseFlashcard = (card: any): BuilderFlashcard => {
  const meta = card?._meta ?? {};
  return {
    ...card,
    id: card.id,
    front: card.front ?? "",
    back: card.back ?? "",
    requirement_ids: card.requirement_ids ?? [],
    generated: card.generated ?? (meta.source === "user" ? false : true),
    edited: card.edited ?? meta.edited ?? false,
    pinned: card.pinned ?? meta.pinned ?? false,
    deleted: !!card.deleted,
  };
};

const normaliseCompanyBrief = (brief: any): CompanyBrief => {
  if (!brief) return { summary: "", what_they_do: "", sources: [], edited: { summary: false, what_they_do: false }, pinned: false };

  return {
    summary: brief.summary ?? "",
    what_they_do: brief.what_they_do ?? brief.businessModel ?? brief.culture ?? "",
    sources: brief.sources ?? [],
    edited: {
      summary: Boolean(brief.edited?.summary ?? brief._meta?.edited ?? false),
      what_they_do: Boolean(brief.edited?.what_they_do ?? false),
    },
    pinned: Boolean(brief.pinned ?? brief._meta?.pinned ?? false),
  };
};

export const mergeGeneratedSection = <T extends { generated?: boolean; edited?: boolean; pinned?: boolean; deleted?: boolean; id?: string }>(existing: T[] = [], regenerated: T[] = []) => {
  const merged = [...regenerated];
  const existingMap = new Map((existing ?? []).map((item) => [item.id, item]));

  for (const item of existing ?? []) {
    if (!item || item.deleted) continue;

    const shouldKeepExisting =
      !!item.edited ||
      !!item.pinned ||
      item.generated === false;

    if (shouldKeepExisting) {
      const existingIndex = merged.findIndex((candidate) => candidate.id === item.id);
      if (existingIndex >= 0) {
        merged[existingIndex] = {
          ...merged[existingIndex],
          ...item,
          generated: item.generated ?? merged[existingIndex].generated,
          edited: item.edited ?? merged[existingIndex].edited,
          pinned: item.pinned ?? merged[existingIndex].pinned,
          deleted: !!item.deleted,
        };
      } else {
        merged.push(item);
      }
      continue;
    }

    const regeneratedItem = merged.find((candidate) => candidate.id === item.id);
    if (regeneratedItem) {
      const replaceIndex = merged.findIndex((candidate) => candidate.id === item.id);
      merged[replaceIndex] = { ...regeneratedItem, ...existingMap.get(item.id) };
    }
  }

  return merged.filter((item) => !item.deleted);
};

export const mergeCompanyBrief = (current: any, incoming: any) => {
  const base = normaliseCompanyBrief(incoming ?? current ?? {});
  const currentBrief = normaliseCompanyBrief(current ?? {});

  const merged = {
    ...base,
    summary: currentBrief.edited?.summary ? currentBrief.summary ?? base.summary : base.summary,
    what_they_do: currentBrief.edited?.what_they_do ? currentBrief.what_they_do ?? base.what_they_do : base.what_they_do,
    sources: currentBrief.pinned ? (currentBrief.sources?.length ? currentBrief.sources : base.sources) : base.sources,
    edited: {
      summary: !!(base.edited?.summary || currentBrief.edited?.summary),
      what_they_do: !!(base.edited?.what_they_do || currentBrief.edited?.what_they_do),
    },
    pinned: !!(base.pinned || currentBrief.pinned),
  };

  if (currentBrief.pinned) {
    merged.summary = currentBrief.summary ?? merged.summary;
    merged.what_they_do = currentBrief.what_they_do ?? merged.what_they_do;
    merged.sources = currentBrief.sources?.length ? currentBrief.sources : merged.sources;
  }

  return merged;
};

export default function useBuilder(initialKit: KitLike, kitIdOverride?: string | null) {
  const [kit, setKit] = useState<KitLike>(() => {
    const normalized = { ...initialKit };
    normalized.questions = (initialKit.questions ?? []).map(normaliseQuestion);
    normalized.flashcards = (initialKit.flashcards ?? []).map(normaliseFlashcard);
    normalized.companyBrief = normaliseCompanyBrief(initialKit.companyBrief ?? initialKit.company_brief);
    if (!normalized.companyBrief.edited) {
      normalized.companyBrief.edited = { summary: false, what_they_do: false };
    }
    return normalized;
  });
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [queuedMutation, setQueuedMutation] = useState<null | {
    action: () => Promise<any>;
    rollback: () => void;
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }>(null);
  const debounceRef = useRef<number | null>(null);
  const debouncedQueuedMutation = useDebounce(queuedMutation, 400);
  const kitId = kitIdOverride ?? initialKit?.id ?? null;

  useEffect(() => {
    const normalized = { ...initialKit };
    normalized.questions = (initialKit.questions ?? []).map(normaliseQuestion);
    normalized.flashcards = (initialKit.flashcards ?? []).map(normaliseFlashcard);
    normalized.companyBrief = normaliseCompanyBrief(initialKit.companyBrief ?? initialKit.company_brief);

    setKit((prev) => {
      const previous = prev ?? { ...initialKit };
      const mergedQuestions = mergeGeneratedSection(previous.questions ?? [], normalized.questions ?? []);
      const mergedFlashcards = mergeGeneratedSection(previous.flashcards ?? [], normalized.flashcards ?? []);
      const mergedBrief = mergeCompanyBrief(previous.companyBrief ?? previous.company_brief, normalized.companyBrief);

      return {
        ...normalized,
        questions: mergedQuestions,
        flashcards: mergedFlashcards,
        companyBrief: mergedBrief,
        company_brief: mergedBrief,
      };
    });
  }, [initialKit]);

  const persist = async (action: () => Promise<any>) => {
    setSaveState("saving");
    try {
      const result = await action();
      setDirty(false);
      setSaveState("saved");
      return result;
    } catch (error) {
      setDirty(true);
      setSaveState("idle");
      throw error;
    }
  };

  const scheduleDebouncedMutation = (action: () => Promise<any>, rollback: () => void) =>
    new Promise((resolve, reject) => {
      setQueuedMutation({ action, rollback, resolve, reject });
    });

  useEffect(() => {
    if (!debouncedQueuedMutation) return;

    const { action, rollback, resolve, reject } = debouncedQueuedMutation;

    persist(action)
      .then(resolve)
      .catch((error) => {
        rollback();
        reject(error);
      })
      .finally(() => setQueuedMutation(null));
  }, [debouncedQueuedMutation]);

  const updateQuestion = async (id: string, patch: Partial<BuilderQuestion>) => {
    const previous = kit.questions ?? [];
    setKit((prev: KitLike) => ({
      ...prev,
      questions: (prev.questions ?? []).map((q) =>
        q.id === id ? { ...normaliseQuestion(q), ...patch, edited: true, updatedAt: new Date().toISOString() } : q,
      ),
    }));
    setDirty(true);

    if (!kitId) return Promise.resolve();

    return scheduleDebouncedMutation(
      async () => {
        const response = await apiUpdateQuestion(kitId, id, patch);
        if (response) {
          setKit((prev: KitLike) => ({
            ...prev,
            questions: (prev.questions ?? []).map((q) =>
              q.id === response.id ? normaliseQuestion({ ...q, ...response }) : q,
            ),
          }));
        }
        return response;
      },
      () => {
        setKit((prev: KitLike) => ({
          ...prev,
          questions: previous,
        }));
        setDirty(false);
      },
    ).catch(() => null);
  };

  const createQuestion = async (category: QuestionCategory = "technical") => {
    const tempId = `q-${Date.now()}`;
    const newQuestion: BuilderQuestion = {
      id: tempId,
      category,
      prompt: "",
      answer_outline: "",
      answer: "",
      requirement_ids: [],
      difficulty: 1,
      generated: false,
      edited: true,
      pinned: false,
      deleted: false,
      order: ((kit.questions ?? []).length + 1) * 1000,
    };

    setKit((prev: KitLike) => ({
      ...prev,
      questions: [...(prev.questions ?? []), newQuestion],
    }));
    setDirty(true);

    if (!kitId) return Promise.resolve(newQuestion);

    return persist(async () => {
      const response = await apiCreateQuestion(kitId, {
        ...newQuestion,
        id: tempId,
        category,
        generated: false,
        edited: true,
      });

      const saved = normaliseQuestion(response);
      setKit((prev: KitLike) => ({
        ...prev,
        questions: (prev.questions ?? []).map((q) => (q.id === tempId ? saved : q)),
      }));
      return saved;
    }).catch(() => {
      setKit((prev: KitLike) => ({
        ...prev,
        questions: (prev.questions ?? []).filter((q) => q.id !== tempId),
      }));
      return null;
    });
  };

  const deleteQuestion = async (id: string) => {
    const previous = kit.questions ?? [];
    setKit((prev: KitLike) => ({
      ...prev,
      questions: (prev.questions ?? []).map((q) =>
        q.id === id ? { ...normaliseQuestion(q), deleted: true, edited: true, updatedAt: new Date().toISOString() } : q,
      ),
    }));
    setDirty(true);

    if (!kitId) return Promise.resolve();

    return persist(async () => {
      await apiDeleteQuestion(kitId, id);
      setKit((prev: KitLike) => ({
        ...prev,
        questions: (prev.questions ?? []).filter((q) => q.id !== id),
      }));
    }).catch(() => {
      setKit((prev: KitLike) => ({
        ...prev,
        questions: previous,
      }));
      setDirty(false);
      return null;
    });
  };

  const moveQuestion = async (id: string, category: QuestionCategory) => {
    const previous = kit.questions ?? [];
    setKit((prev: KitLike) => ({
      ...prev,
      questions: (prev.questions ?? []).map((q) =>
        q.id === id ? { ...normaliseQuestion(q), category, edited: true } : q,
      ),
    }));
    setDirty(true);

    if (!kitId) return Promise.resolve();

    return persist(async () => {
      const response = await apiMoveQuestion(kitId, id, category);
      return response;
    }).catch(() => {
      setKit((prev: KitLike) => ({
        ...prev,
        questions: previous,
      }));
      setDirty(false);
      return null;
    });
  };

  const reorderQuestions = async (category: string, orderedIds: string[]) => {
    const previous = kit.questions ?? [];
    const nextQuestions = (kit.questions ?? []).map((q) => {
      if (q.category !== category || q.deleted) return q;
      const index = orderedIds.indexOf(q.id);
      return { ...normaliseQuestion(q), order: index >= 0 ? (index + 1) * 1000 : q.order ?? 1000 };
    });

    setKit((prev: KitLike) => ({
      ...prev,
      questions: nextQuestions,
    }));
    setDirty(true);

    if (!kitId) return Promise.resolve();

    return persist(async () => {
      const response = await apiReorderQuestions(kitId, category, orderedIds);
      return response;
    }).catch(() => {
      setKit((prev: KitLike) => ({
        ...prev,
        questions: previous,
      }));
      setDirty(false);
      return null;
    });
  };


  const updateFlashcard = async (id: string, patch: Partial<BuilderFlashcard>) => {
    const previous = kit.flashcards ?? [];
    setKit((prev: KitLike) => ({
      ...prev,
      flashcards: (prev.flashcards ?? []).map((card) =>
        card.id === id ? { ...normaliseFlashcard(card), ...patch, edited: true, updatedAt: new Date().toISOString() } : card,
      ),
    }));
    setDirty(true);

    if (!kitId) return Promise.resolve();

    return scheduleDebouncedMutation(
      async () => {
        const response = await apiUpdateFlashcard(kitId, id, patch);
        if (response) {
          setKit((prev: KitLike) => ({
            ...prev,
            flashcards: (prev.flashcards ?? []).map((card) =>
              card.id === response.id ? normaliseFlashcard({ ...card, ...response }) : card,
            ),
          }));
        }
        return response;
      },
      () => {
        setKit((prev: KitLike) => ({
          ...prev,
          flashcards: previous,
        }));
        setDirty(false);
      },
    ).catch(() => null);
  };

  const createFlashcard = async () => {
    const tempId = `f-${Date.now()}`;
    const newCard: BuilderFlashcard = {
      id: tempId,
      front: "",
      back: "",
      requirement_ids: [],
      generated: false,
      edited: true,
      pinned: false,
      deleted: false,
    };

    setKit((prev: KitLike) => ({
      ...prev,
      flashcards: [...(prev.flashcards ?? []), newCard],
    }));
    setDirty(true);

    if (!kitId) return Promise.resolve(newCard);

    return persist(async () => {
      const response = await apiCreateFlashcard(kitId, newCard);
      const saved = normaliseFlashcard(response);
      setKit((prev: KitLike) => ({
        ...prev,
        flashcards: (prev.flashcards ?? []).map((card) => (card.id === tempId ? saved : card)),
      }));
      return saved;
    }).catch(() => {
      setKit((prev: KitLike) => ({
        ...prev,
        flashcards: (prev.flashcards ?? []).filter((card) => card.id !== tempId),
      }));
      return null;
    });
  };

  const deleteFlashcard = async (id: string) => {
    const previous = kit.flashcards ?? [];
    setKit((prev: KitLike) => ({
      ...prev,
      flashcards: (prev.flashcards ?? []).map((card) =>
        card.id === id ? { ...normaliseFlashcard(card), deleted: true, edited: true } : card,
      ),
    }));
    setDirty(true);

    if (!kitId) return Promise.resolve();

    return persist(async () => {
      await apiDeleteFlashcard(kitId, id);
      setKit((prev: KitLike) => ({
        ...prev,
        flashcards: (prev.flashcards ?? []).filter((card) => card.id !== id),
      }));
    }).catch(() => {
      setKit((prev: KitLike) => ({
        ...prev,
        flashcards: previous,
      }));
      setDirty(false);
      return null;
    });
  };

  const updateCompanyBrief = async (field: keyof CompanyBrief, value: string | string[] | boolean | undefined) => {
    const previous = kit.companyBrief ?? normaliseCompanyBrief(kit.company_brief);

    setKit((prev: KitLike) => {
      const nextBrief = normaliseCompanyBrief(prev.companyBrief ?? prev.company_brief ?? {});
      const target = { ...nextBrief };
      if (field === "summary") target.summary = value as string;
      if (field === "what_they_do") target.what_they_do = value as string;
      if (field === "sources") target.sources = value as string[];
      target.edited = {
        summary: field === "summary" ? true : !!target.edited?.summary,
        what_they_do: field === "what_they_do" ? true : !!target.edited?.what_they_do,
      };

      return { ...prev, companyBrief: target, company_brief: target };
    });
    setDirty(true);

    if (!kitId) return Promise.resolve();

    const requestBody = field === "summary" ? { summary: value } : field === "what_they_do" ? { what_they_do: value } : { [field]: value };

    return scheduleDebouncedMutation(
      async () => {
        const response = await apiUpdateCompanyBrief(kitId, requestBody);
        setKit((prev: KitLike) => ({
          ...prev,
          companyBrief: normaliseCompanyBrief(response),
          company_brief: response,
        }));
        return response;
      },
      () => {
        setKit((prev: KitLike) => ({
          ...prev,
          companyBrief: previous,
          company_brief: previous,
        }));
        setDirty(false);
      },
    ).catch(() => null);
  };

  const groupedQuestions = useMemo(() => {
    const buckets: Record<string, BuilderQuestion[]> = {};

    (kit.questions ?? [])
      .filter((question) => !question.deleted)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .forEach((question) => {
        const key = question.category || "technical";
        if (!buckets[key]) buckets[key] = [];
        buckets[key].push(normaliseQuestion(question));
      });

    return buckets;
  }, [kit.questions]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (saveState === "saving") {
      debounceRef.current = window.setTimeout(() => {
        setSaveState("saved");
      }, 500);
    }

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [saveState]);

  return {
    kit,
    dirty,
    saveState,
    questions: (kit.questions ?? []).filter((question) => !question.deleted),
    flashcards: (kit.flashcards ?? []).filter((card) => !card.deleted),
    companyBrief: normaliseCompanyBrief(kit.companyBrief ?? kit.company_brief),
    groupedQuestions,
    updateQuestion,
    createQuestion,
    deleteQuestion,
    moveQuestion,
    reorderQuestions,
    updateFlashcard,
    createFlashcard,
    deleteFlashcard,
    updateCompanyBrief,
    setDirty,
  };
}
