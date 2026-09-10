

const QUESTION_MINUTES = {
  1: 20, // easy
  2: 30, // medium
  3: 40, // hard
};

const CATEGORY_WEIGHT = { //0 is the highest priority
  technical: 0,
  system_design: 1,
  experience: 2,
  behavioral: 3,
};

export function buildSchedule(daysAvailable, questions, requirements) {
  if (daysAvailable < 1) throw new Error("daysAvailable must be >= 1");

  const reqMap = new Map(requirements.map(r => [r.id, r]));

  // Sort by priority → category → difficulty
  const ordered = [...questions].sort((a, b) => {
    const pa = highestPriority(a, reqMap);
    const pb = highestPriority(b, reqMap);

    if (pa !== pb) return pa - pb;

    const ca = CATEGORY_WEIGHT[a.category] ?? 99;
    const cb = CATEGORY_WEIGHT[b.category] ?? 99;

    if (ca !== cb) return ca - cb;

    return b.difficulty - a.difficulty;
  });

  const buckets = Array.from({ length: daysAvailable }, () => []);

  // Even distribution (round robin)
  ordered.forEach((q, i) => {
    buckets[i % daysAvailable].push(q);
  });

  const days = buckets.map((items, i) => ({
    day: i + 1,
    questions: items.map(q => q.id),
    minutes: items.reduce(
      (sum, q) => sum + (QUESTION_MINUTES[q.difficulty] || 30),
      0
    ),
  }));

  return {
    total_days: daysAvailable,
    total_questions: questions.length,
    days,
  };
}

function highestPriority(question, reqMap) {
  let best = 2; // nice

  for (const id of question.requirement_ids) {
    const req = reqMap.get(id);

    if (!req) continue;

    if (req.priority === "must") best = Math.min(best, 0);
    else if (req.priority === "should") best = Math.min(best, 1);
  }

  return best;
}