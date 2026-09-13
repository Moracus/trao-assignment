import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getKit } from "../api/kits";

const PRACTICE_STORAGE_KEY = "practice-progress";

const readProgressMap = (kitId) => {
  try {
    const raw = localStorage.getItem(PRACTICE_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};

    return parsed[kitId] ?? {};
  } catch {
    return {};
  }
};

const writeProgressMap = (kitId, map) => {
  try {
    const raw = localStorage.getItem(PRACTICE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[kitId] = map;
    localStorage.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore localStorage errors
  }
};

const scoreLabel = (score) => {
  if (score <= 0) return "Unseen";
  if (score === 1) return "Needs work";
  if (score === 2) return "Okay";
  return "Strong";
};

export default function PracticePage() {
  const { kitId } = useParams();
  const navigate = useNavigate();
  const [kit, setKit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progressMap, setProgressMap] = useState(() => (kitId ? readProgressMap(kitId) : {}));
  const [revealed, setRevealed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!kitId) return;

    let ignore = false;

    const loadKit = async () => {
      try {
        const data = await getKit(kitId);
        if (!ignore) setKit(data);
      } catch (error) {
        console.error("Failed to load kit for practice mode", error);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    setProgressMap(readProgressMap(kitId));
    loadKit();

    return () => {
      ignore = true;
    };
  }, [kitId]);

  useEffect(() => {
    if (!kitId) return;
    writeProgressMap(kitId, progressMap);
  }, [kitId, progressMap]);

  const flashcards = useMemo(() => kit?.flashcards ?? [], [kit]);

  const orderedCards = useMemo(() => {
    return [...flashcards].sort((a, b) => {
      const scoreA = progressMap[a.id]?.confidence ?? 0;
      const scoreB = progressMap[b.id]?.confidence ?? 0;
      return scoreA - scoreB;
    });
  }, [flashcards, progressMap]);

  const activeCard = orderedCards[currentIndex] ?? null;
  const currentConfidence = activeCard ? progressMap[activeCard.id]?.confidence ?? 0 : 0;

  const totalReviewed = useMemo(() => {
    return flashcards.filter((card) => (progressMap[card.id]?.confidence ?? 0) > 0).length;
  }, [flashcards, progressMap]);

  const totalMastered = useMemo(() => {
    return flashcards.filter((card) => (progressMap[card.id]?.confidence ?? 0) >= 3).length;
  }, [flashcards, progressMap]);

  const weakestCard = useMemo(() => {
    if (!orderedCards.length) return null;
    const lowest = orderedCards[0];
    return lowest ? { ...lowest, score: progressMap[lowest.id]?.confidence ?? 0 } : null;
  }, [orderedCards, progressMap]);

  const markConfidence = (nextConfidence) => {
    if (!activeCard) return;

    setProgressMap((current) => {
      const next = { ...current };
      const previous = next[activeCard.id] ?? { confidence: 0, reviewCount: 0 };

      next[activeCard.id] = {
        ...previous,
        confidence: nextConfidence,
        reviewCount: (previous.reviewCount ?? 0) + 1,
        lastReviewedAt: new Date().toISOString(),
      };

      return next;
    });

    setRevealed(false);

    setCurrentIndex((index) => {
      if (orderedCards.length <= 1) return 0;
      return (index + 1) % orderedCards.length;
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="rounded-2xl border bg-white p-6 text-slate-700 shadow-sm">Loading practice mode…</div>
      </div>
    );
  }

  if (!kit) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-2xl border border-red-100 bg-white p-6 text-center shadow-sm">
          <h2 className="text-xl font-bold text-slate-800">Kit not found</h2>
          <p className="mt-2 text-sm text-slate-600">This practice session could not be loaded.</p>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="mt-4 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!flashcards.length) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-2xl rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Practice mode</p>
          <h1 className="mt-2 text-2xl font-bold">No flashcards yet</h1>
          <p className="mt-3 text-slate-600">Add or generate flashcards in the Builder before starting a practice session.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate(`/builder/${kitId}`)}
              className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
            >
              Back to Builder
            </button>
            <Link to="/dashboard" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Practice mode</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{kit.company ?? "Interview kit"}</h1>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/builder/${kitId}`)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Back to builder
          </button>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Cards</p>
            <p className="mt-2 text-3xl font-bold">{flashcards.length}</p>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Reviewed</p>
            <p className="mt-2 text-3xl font-bold">{totalReviewed}</p>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Strong</p>
            <p className="mt-2 text-3xl font-bold">{totalMastered}</p>
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Current card</p>
              <p className="mt-1 text-sm text-slate-500">
                {currentIndex + 1} / {orderedCards.length} · {scoreLabel(currentConfidence)}
              </p>
            </div>

            {weakestCard && (
              <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                Weakest: {scoreLabel(weakestCard.score || 0)}
              </div>
            )}
          </div>

          {activeCard && (
            <>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Front</p>
                <p className="text-lg font-semibold leading-8 text-slate-800 sm:text-xl">{activeCard.front}</p>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Answer</p>
                  <button
                    type="button"
                    onClick={() => setRevealed((value) => !value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700"
                  >
                    {revealed ? "Hide answer" : "Reveal answer"}
                  </button>
                </div>

                {revealed ? (
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">{activeCard.back}</p>
                ) : (
                  <p className="mt-3 text-sm italic text-slate-400">Answer hidden until you reveal it.</p>
                )}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => markConfidence(1)}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                >
                  Needs work
                </button>
                <button
                  type="button"
                  onClick={() => markConfidence(2)}
                  className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 transition hover:bg-amber-100"
                >
                  Okay
                </button>
                <button
                  type="button"
                  onClick={() => markConfidence(3)}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                >
                  Strong
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
