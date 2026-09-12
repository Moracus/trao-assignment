export const mockKit = {
  id: "kit_uber_001",
  role: "Software Engineer",
  company: "Uber",
  status: "ready",

  companyBrief: {
    summary:
      "Uber builds global mobility and logistics infrastructure across ride sharing, delivery, freight and mapping.",
    businessModel:
      "Marketplace connecting riders, drivers, merchants and couriers.",
    culture:
      "Ownership, customer obsession, high engineering quality and data-driven decision making.",
    _meta: {
      source: "generated",
      edited: false,
      pinned: false,
    },
  },

  questions: [
    {
      id: "q1",
      category: "React",
      prompt: "Explain React reconciliation.",
      answer:
        "Discuss Virtual DOM, diffing, keys and how React minimizes DOM mutations.",
      _meta: {
        source: "generated",
        edited: false,
        pinned: false,
      },
      order:10
    },
    {
      id: "q2",
      category: "Backend",
      prompt: "Design a distributed rate limiter.",
      answer: "Token bucket + Redis + Lua scripts + consistency tradeoffs.",
      _meta: {
        source: "generated",
        edited: true,
        pinned: false,
      },
       order:20
    },
   
  ],

  flashcards: [
    {
      id: "f1",
      front: "What is hydration?",
      back: "Attaching event listeners to server-rendered HTML.",
      _meta: { source: "generated", edited: false },
    },
    {
      id: "f2",
      front: "CAP theorem",
      back: "Consistency, Availability, Partition tolerance.",
      _meta: { source: "user", edited: false },
    },
  ],

  schedule: [
    {
      day: 1,
      duration: 90,
      focus: "React + JavaScript",
      questions: ["q1"],
    },
    {
      day: 2,
      duration: 75,
      focus: "Backend Systems",
      questions: ["q2"],
    },
  ],

  coverage: {
    covered: 10,
    total: 12,
    uncovered: ["Mentoring engineers", "Performance optimization"],
  },
};
