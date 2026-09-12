import { useMemo, useState } from "react";

export default function useBuilderState(initialKit) {
  const [kit, setKit] = useState(initialKit);
  const [dirty, setDirty] = useState(false);

  const markDirty = () => setDirty(true);

  /* ---------- Company Brief ---------- */

  const updateBrief = (field, value) => {
    setKit((prev) => ({
      ...prev,
      companyBrief: {
        ...prev.companyBrief,
        [field]: value,
        _meta: {
          ...prev.companyBrief._meta,
          edited: true,
        },
      },
    }));
    setDirty(true);
  };

  /* ---------- Questions ---------- */

  const updateQuestion = (id, patch) => {
    setKit((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === id
          ? {
              ...q,
              ...patch,
              _meta: {
                ...q._meta,
                edited: true,
              },
            }
          : q,
      ),
    }));
    markDirty();
  };

  const addQuestion = (category = "General") => {
    const maxOrder = Math.max(0, ...kit.questions.map((q) => q.order ?? 0));

    const newQuestion = {
      id: crypto.randomUUID(),
      category,
      prompt: "New Question",
      answer: "",
      _meta: {
        source: "user",
        edited: false,
        pinned: false,
      },
      order: maxOrder + 1000,
    };

    setKit((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));

    markDirty();
  };

  const deleteQuestion = (id) => {
    setKit((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== id),
    }));
    markDirty();
  };

  const duplicateQuestion = (id) => {
    setKit((prev) => {
      const original = prev.questions.find((q) => q.id === id);
      if (!original) return prev;

      const copy = {
        ...original,
        id: crypto.randomUUID(),
        prompt: `${original.prompt} (Copy)`,
        _meta: {
          ...original._meta,
          source: "user",
        },
      };

      const index = prev.questions.findIndex((q) => q.id === id);

      const next = [...prev.questions];
      next.splice(index + 1, 0, copy);

      return {
        ...prev,
        questions: next,
      };
    });

    markDirty();
  };

  const togglePin = (id) => {
    setKit((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === id
          ? {
              ...q,
              _meta: {
                ...q._meta,
                pinned: !q._meta.pinned,
              },
            }
          : q,
      ),
    }));
    markDirty();
  };
  const changeCategory = (id, category) => {
    setKit((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === id
          ? {
              ...q,
              category,
              _meta: { ...q._meta, edited: true },
            }
          : q,
      ),
    }));
    markDirty();
  };

  /* ---------- Flashcards ---------- */

  const updateFlashcard = (id, patch) => {
    setKit((prev) => ({
      ...prev,
      flashcards: prev.flashcards.map((card) =>
        card.id === id
          ? {
              ...card,
              ...patch,
              _meta: {
                ...card._meta,
                edited: true,
              },
            }
          : card,
      ),
    }));

    markDirty();
  };

  const addFlashcard = () => {
    setKit((prev) => ({
      ...prev,
      flashcards: [
        ...prev.flashcards,
        {
          id: crypto.randomUUID(),
          front: "",
          back: "",
          _meta: {
            source: "user",
            edited: false,
          },
        },
      ],
    }));

    markDirty();
  };

  const deleteFlashcard = (id) => {
    setKit((prev) => ({
      ...prev,
      flashcards: prev.flashcards.filter((c) => c.id !== id),
    }));
    markDirty();
  };

  const duplicateFlashcard = (id) => {
    setKit((prev) => {
      const original = prev.flashcards.find((c) => c.id === id);
      if (!original) return prev;

      const copy = {
        ...original,
        id: crypto.randomUUID(),
        front: `${original.front} (Copy)`,
        _meta: {
          ...original._meta,
          source: "user",
        },
      };

      const index = prev.flashcards.findIndex((c) => c.id === id);
      const next = [...prev.flashcards];
      next.splice(index + 1, 0, copy);

      return { ...prev, flashcards: next };
    });

    markDirty();
  };

  /* ---------- Derived ---------- */

  const groupedQuestions = useMemo(() => {
    const groups = {};

    [...kit.questions]
      .sort((a, b) => a.order - b.order)
      .forEach((q) => {
        if (!groups[q.category]) groups[q.category] = [];
        groups[q.category].push(q);
      });

    return groups;
  }, [kit.questions]);

  const moveQuestion = (id, direction) => {
    setKit((prev) => {
      const questions = [...prev.questions];

      const ordered = questions.sort((a, b) => a.order - b.order);

      const index = ordered.findIndex((q) => q.id === id);
      if (index === -1) return prev;

      const target = direction === "up" ? index - 1 : index + 1;

      if (target < 0 || target >= ordered.length) return prev;

      const current = ordered[index];
      const other = ordered[target];

      const temp = current.order;
      current.order = other.order;
      other.order = temp;

      return {
        ...prev,
        questions: [...questions],
      };
    });

    markDirty();
  };
  return {
    kit,
    dirty,

    groupedQuestions,

    updateBrief,

    updateQuestion,
    addQuestion,
    deleteQuestion,
    duplicateQuestion,
    togglePin,

    updateFlashcard,
    addFlashcard,
    changeCategory,
    moveQuestion,
    deleteFlashcard,
    duplicateFlashcard,
  };
}
