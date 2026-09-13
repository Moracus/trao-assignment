// deterministic/schedule.js

const QUESTION_MINUTES = {
  1: 20,
  2: 30,
  3: 40,
};

const CATEGORY_WEIGHT = {
  technical: 0,
  "system-design": 1,
  "company-fit": 2,
  behavioural: 3,
};

export function buildSchedule(daysAvailable, questions, requirements) {
  const safeDays = Number.isFinite(daysAvailable) ? Math.max(1, Number(daysAvailable)) : 1;
  const safeQuestions = Array.isArray(questions) ? questions : [];
  const safeRequirements = Array.isArray(requirements) ? requirements : [];

  if (safeQuestions.length === 0) {
    return {
      days_available: safeDays,
      days: Array.from({ length: safeDays }, (_, index) => ({
        day: index + 1,
        focus: "Revision",
        question_ids: [],
        minutes: 0,
      })),
    };
  }

  const reqMap = new Map(safeRequirements.map((r) => [r.id, r]));

  const ordered = [...safeQuestions].sort((a, b) => {
    const pa = priorityScore(a, reqMap);
    const pb = priorityScore(b, reqMap);

    if (pa !== pb) return pa - pb;

    const ca = CATEGORY_WEIGHT[a.category] ?? 99;
    const cb = CATEGORY_WEIGHT[b.category] ?? 99;

    if (ca !== cb) return ca - cb;

    return b.difficulty - a.difficulty;
  });

  const totalMinutes = ordered.reduce(
    (sum, q) => sum + QUESTION_MINUTES[q.difficulty],
    0,
  );

  const targetPerDay = Math.ceil(totalMinutes / safeDays);

  const days = [];
  let current = [];
  let currentMinutes = 0;
  let dayNumber = 1;

  for (const q of ordered) {
    const qMinutes = QUESTION_MINUTES[q.difficulty];

    const shouldAdvance =
      dayNumber < safeDays &&
      current.length > 0 &&
      currentMinutes + qMinutes > targetPerDay;

    if (shouldAdvance) {
      days.push(makeDay(dayNumber, current, currentMinutes, reqMap));
      dayNumber += 1;
      current = [];
      currentMinutes = 0;
    }

    current.push(q);
    currentMinutes += qMinutes;
  }

  while (dayNumber <= safeDays) {
    if (dayNumber === days.length + 1) {
      days.push(makeDay(dayNumber, current, currentMinutes, reqMap));
      current = [];
      currentMinutes = 0;
    } else {
      days.push({
        day: dayNumber,
        focus: "Revision",
        question_ids: [],
        minutes: 0,
      });
    }
    dayNumber += 1;
  }

  return {
    days_available: safeDays,
    days,
  };
}

function makeDay(day, questions, minutes, reqMap) {
  return {
    day,
    focus: deriveFocus(questions, reqMap),
    question_ids: questions.map(q => q.id),
    minutes,
  };
}

function priorityScore(question, reqMap) {
  const reqs = question.requirement_ids
    .map(id => reqMap.get(id))
    .filter(Boolean);

  return reqs.some(r => r.priority === "must") ? 0 : 1;
}

function deriveFocus(questions, reqMap) {
  if (questions.length === 0) return "Revision";

  const counts = {};

  for (const q of questions) {
    for (const id of q.requirement_ids) {
      const req = reqMap.get(id);
      if (!req) continue;

      counts[req.text] = (counts[req.text] || 0) + 1;
    }
  }

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}