export const mockKit = {
  id: "kit_uber_swe1",
  version: 1,
  status: "ready",

  role: {
    company: "Uber",
    title: "Software Engineer I",
    job_description:
      "Join Uber's Rider Experience team to build scalable frontend and backend systems used by millions of users globally.",

    requirements: [
      { id: "r1", text: "React expertise", type: "must" },
      { id: "r2", text: "JavaScript fundamentals", type: "must" },
      { id: "r3", text: "Backend API design", type: "must" },
      { id: "r4", text: "Distributed systems", type: "must" },
      { id: "r5", text: "SQL & database knowledge", type: "must" },
      { id: "r6", text: "System design thinking", type: "must" },
      { id: "r7", text: "Performance optimization", type: "nice" },
      { id: "r8", text: "Mentoring engineers", type: "nice" },
      { id: "r9", text: "CI/CD experience", type: "nice" },
      { id: "r10", text: "Accessibility", type: "nice" },
    ],
  },

  companyBrief: {
    summary:
      "Uber builds global mobility and logistics infrastructure powering ride-sharing, food delivery, freight, and mapping across more than 70 countries.",

    businessModel:
      "Uber operates a marketplace connecting riders, drivers, merchants, and couriers while earning revenue through transaction fees and logistics services.",

    culture:
      "Ownership, customer obsession, high engineering quality, experimentation, and data-driven decision making are core engineering values.",

    _meta: {
      source: "generated",
      edited: true,
      pinned: false,
    },
  },

  questions: [
    {
      id: "q1",
      category: "React",
      order: 1000,
      prompt: "Explain React reconciliation and the role of keys.",
      answer:
        "Discuss Virtual DOM diffing, keyed list reconciliation, and how React minimizes DOM mutations.",
      requirement_ids: ["r1", "r2"],
      _meta: {
        source: "generated",
        edited: false,
        pinned: true,
      },
    },
    {
      id: "q2",
      category: "Backend",
      order: 2000,
      prompt: "Design a distributed rate limiter.",
      answer:
        "Explain token bucket, Redis, Lua scripts, atomicity, horizontal scaling and consistency tradeoffs.",
      requirement_ids: ["r3", "r4", "r6"],
      _meta: {
        source: "generated",
        edited: true,
        pinned: false,
      },
    },
    {
      id: "q3",
      category: "SQL",
      order: 3000,
      prompt: "Difference between clustered and non-clustered indexes.",
      answer:
        "Cover B-Tree structure, lookup complexity, storage layout and write tradeoffs.",
      requirement_ids: ["r5"],
      _meta: {
        source: "generated",
        edited: false,
        pinned: false,
      },
    },
    {
      id: "q4",
      category: "React",
      order: 4000,
      prompt: "How would you optimize a large React dashboard?",
      answer:
        "Memoization, virtualization, code splitting, lazy loading, avoiding unnecessary renders.",
      requirement_ids: ["r1", "r7"],
      _meta: {
        source: "user",
        edited: false,
        pinned: false,
      },
    },
    {
      id: "q5",
      category: "Behavioral",
      order: 5000,
      prompt: "Tell me about a difficult engineering tradeoff you made.",
      answer:
        "Use STAR format with context, options considered, decision rationale and measurable impact.",
      requirement_ids: [],
      _meta: {
        source: "generated",
        edited: false,
        pinned: false,
      },
    },
  ],

  flashcards: [
    {
      id: "f1",
      front: "What is hydration?",
      back: "Attaching event listeners to server-rendered HTML.",
      _meta: {
        source: "generated",
        edited: false,
      },
    },
    {
      id: "f2",
      front: "CAP Theorem",
      back: "Consistency, Availability and Partition Tolerance — only two can be fully guaranteed during a partition.",
      _meta: {
        source: "generated",
        edited: true,
      },
    },
    {
      id: "f3",
      front: "useMemo vs useCallback",
      back: "useMemo memoizes values, useCallback memoizes function references.",
      _meta: {
        source: "user",
        edited: false,
      },
    },
  ],

  schedule: [
    {
      day: 1,
      duration: 90,
      focus: "React fundamentals & rendering",
      questions: ["q1", "q4"],
    },
    {
      day: 2,
      duration: 75,
      focus: "Backend systems & SQL",
      questions: ["q2", "q3"],
    },
    {
      day: 3,
      duration: 60,
      focus: "Behavioral + revision",
      questions: ["q5", "q1"],
    },
  ],

  coverage: {
    uncovered_requirement_ids: ["r8", "r9", "r10"],
    passes: 2,

    // Builder UI extensions
    score: 70,
    last_checked: "2026-09-12T12:30:00Z",
  },

  generatedAt: "2026-09-12T12:15:00Z",
};
