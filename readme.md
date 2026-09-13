# Intraowow — AI Interview Prep Kit

> Turn any Job Description + Company Website into a personalized interview preparation kit.

![License](https://img.shields.io/badge/license-MIT-black)
![Node](https://img.shields.io/badge/node-20.x-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen)
![React](https://img.shields.io/badge/React-Vite-61DAFB)

---

## Overview

Intraowow is a full-stack application that automates interview preparation.

A user provides:

- Job description
- Company website
- Days remaining before interview

The system performs multi-stage retrieval and generation to produce a structured preparation kit consisting of:

- Company Brief
- Role Breakdown
- Requirement Extraction
- Categorized Interview Questions
- Flashcards
- Day-wise Study Schedule
- Coverage Report

Unlike a single-prompt solution, Intraowow uses a deterministic pipeline with validation, coverage checking and regeneration to ensure every **must-have** requirement receives at least one interview question.

---

# Why this stack?

| Layer | Technology |
|---------|------------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | MongoDB |
| Authentication | Session Cookies |
| LLM | Gemini 2.5 Flash |
| Scraping | Cheerio + Native Fetch |
| Realtime Progress | Socket.IO |

The assessment recommends Next.js, but I intentionally chose **React + Vite** because:

- Faster local iteration
- Simpler SPA architecture
- Session authentication works identically
- No SSR was required for this product

The backend remains fully separated from the UI, so replacing Vite with Next.js would require minimal changes.

---

# Features

- Secure session authentication
- Personal dashboard
- Generate interview kits
- Company website crawling
- Hiring process discovery
- Reddit/public interview discussion retrieval
- Multi-pass question generation
- Coverage validation
- Inline builder (edit, reorder, regenerate)
- Flashcard practice mode
- Confidence tracking
- Deterministic schedule allocation
- Batch evaluation CLI

---

# High Level Architecture

```text
                   ┌──────────────────────┐
                   │ React Frontend (SPA) │
                   └──────────┬───────────┘
                              │
                    Session Cookie (HTTP Only)
                              │
                 ┌────────────▼─────────────┐
                 │ Express API + Socket.IO  │
                 └───────┬────────┬─────────┘
                         │        │
             CRUD/Builder│        │Realtime Progress
                         │        │
                 ┌───────▼────────▼─────────┐
                 │      Kit Service          │
                 └──────────┬───────────────┘
                            │
        ┌───────────────────┼────────────────────┐
        │                   │                    │
        ▼                   ▼                    ▼
 Requirement Extractor   Web Retriever     LLM Generator
        │                   │                    │
        │          Crawl + About + Careers       │
        │                   │                    │
        └──────────────┬────┴────────────────────┘
                       ▼
              Coverage Validator
                       │
             Missing Requirements?
                  Yes ──────── No
                       │
                       ▼
          Generate Missing Questions
                       │
                       ▼
            Schedule Allocator (JS)
                       │
                       ▼
                MongoDB Persistence
```

---

# Retrieval Strategy

The application **does not** directly ask the LLM to invent company information.

Instead it performs staged retrieval.

## Stage 1 — Job Description

Input is parsed into structured requirements.

Output:

- title
- seniority
- responsibilities
- requirements
- priority (must / nice)
- kind (technical / behavioural / domain)

This step never performs retrieval because the JD is already available.

---

## Stage 2 — Company Crawl

Starting from the provided company URL:

1. Fetch homepage
2. Parse internal links
3. Score links using keywords
4. Crawl highest ranked pages
5. Clean HTML into text

Priority keywords:

- about
- careers
- jobs
- engineering
- culture
- handbook
- blog

Relative URLs are resolved correctly, allowing localhost evaluation as required.

---

## Stage 3 — Hiring Process Research

The retriever searches public discussion sources including:

- Company careers pages
- Engineering blogs
- Public interview experiences
- Reddit discussions (when available)

Missing sources become **warnings**, not failures.

Example:

```json
"retrievalWarnings": [
  "No hiring page discovered",
  "No public interview discussion found"
]
```

This satisfies the assessment requirement of honest partial research.

---

# Research & Generation Pipeline

The pipeline intentionally separates responsibilities.

| Step | Deterministic | LLM |
|------|------|------|
| Parse JD | ❌ | ✅ |
| Crawl Website | ✅ | ❌ |
| Clean HTML | ✅ | ❌ |
| Company Summary | ❌ | ✅ |
| Generate Questions | ❌ | ✅ |
| Generate Flashcards | ❌ | ✅ |
| Coverage Check | ✅ | ❌ |
| Schedule Allocation | ✅ | ❌ |

The LLM is never allowed to decide scheduling or coverage.

---

# Second Pass (Coverage Loop)

The most important design decision is the validation loop.

### Pass 1

Generate questions from extracted requirements.

```
Requirements: 12
Questions: 16

Covered:
✓ r1
✓ r2
✓ r3

Missing:
r8
r11
```

### Coverage Check

JavaScript compares every `requirement.id` against every `question.requirement_ids`.

### Pass 2

Only uncovered requirements are sent back to Gemini.

This minimizes tokens while guaranteeing complete coverage.

Maximum passes: **2**

Reason:

- Prevents infinite regeneration
- Reduces API cost
- Nearly all uncovered cases resolve within one retry

The final kit stores:

```json
"coverage": {
  "passes": 2,
  "uncovered_requirement_ids": []
}
```

---

# Builder State Management

The hardest part of the assessment is regeneration without losing edits.

Every editable object has three logical states:

| State | Meaning |
|---------|----------|
| generated | Created by AI |
| edited | Modified by user |
| pinned | Locked from regeneration |

## Regeneration Rule

When regenerating a category:

1. Remove only generated items
2. Preserve edited items
3. Preserve pinned items
4. Merge newly generated questions
5. Re-run coverage

Example:

```
Technical Category

AI Q1
AI Q2
Edited Q3
Pinned Q4

↓

Regenerate

New AI Q5
New AI Q6
Edited Q3
Pinned Q4
```

This keeps user work intact while refreshing only AI content.

---

# Practice Mode

Flashcards are stored separately from progress.

Schema:

```
Flashcard
 ├── front
 ├── back
 ├── knowledge_slug

UserFlashcardProgress
 ├── user
 ├── flashcard
 ├── mastered
 ├── reviewCount
 └── lastReviewedAt
```

This allows one flashcard to be reused across multiple kits while each user maintains independent progress.

Next review order uses a simple confidence-weighted strategy:

```
score =
(reviewCount * 0.4)
+
(mastered ? 5 : 0)
+
(recency penalty)
```

Lower score = shown earlier.

I intentionally chose this over full spaced repetition because it is easier to explain and deterministic.

---

# Schedule Allocation

The schedule is **pure JavaScript**, not AI.

Inputs:

- days available
- must requirements
- nice requirements
- question difficulty

Algorithm:

1. Sort must requirements first
2. Sort by difficulty (Hard → Easy)
3. Evenly distribute across N days
4. Fill remaining slots with nice-to-have topics
5. Compute total minutes using difficulty weights

Difficulty weights:

| Difficulty | Minutes |
|------------|---------|
| Easy | 20 |
| Medium | 35 |
| Hard | 50 |

Example for 5 days:

| Day | Focus |
|------|------|
| 1 | React + Performance |
| 2 | State Management |
| 3 | System Design |
| 4 | Behavioural |
| 5 | Company Fit + Revision |

This guarantees:

- exactly N days
- every must requirement appears
- earlier days contain harder topics

---

# Database Design

Core collections:

```
User
│
├── username
├── email
└── password

Kit
│
├── source
├── company_brief
├── role
├── questions
├── schedule
├── coverage
└── retrievalWarnings

Flashcard

Knowledge

UserFlashcardProgress
```

Kits are owned by users through session authentication.

A `duplicateHash` prevents regenerating identical JD + Company combinations.

---

# Security Decisions

## Authentication

- Session cookies
- HTTP Only
- SameSite=Lax
- Protected routes
- User-scoped queries only

## URL Validation

Before crawling:

- Reject localhost/private IPs in production
- Validate protocol
- Enforce content-type
- Maximum response size
- Timeout + retry

## Prompt Injection Protection

Fetched webpages are treated as **content**, never instructions.

The system prompt explicitly separates:

- Job description
- Company pages
- User input

and instructs the model to ignore embedded instructions inside retrieved text.

---

# Edge Cases

| Case | Behaviour |
|------|-----------|
| Invalid company URL | Retry → Failed |
| 404 | Recorded error |
| Timeout | Exponential backoff |
| No careers page | Warning only |
| Tiny JD | Thin kit produced |
| No Reddit results | Honest company brief |
| Invalid LLM JSON | Retry with repair prompt |
| Rate limit | Backoff + retry |
| Duplicate submission | Existing kit reused |
| 1 day schedule | Everything compressed |
| 60 day schedule | Review days inserted |

The application prefers **honesty over hallucination**.

---

# Batch Evaluation

Run exactly as required:

```bash
npm run evaluate -- \
  --input cases.json \
  --output kits.json
```

The evaluator:

- Reads multiple cases
- Uses the same production pipeline
- Continues after failures
- Produces Appendix-B compliant JSON

---

# Environment Variables

```env
PORT=5000

MONGODB_URI=

SESSION_SECRET=

GEMINI_API_KEY=

REDDIT_CLIENT_ID=
REDDIT_SECRET=

NODE_ENV=development
```

---

# Local Setup

### Backend

```bash
cd backend

npm install

npm run dev
```

### Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# Deployment

| Service | Platform |
|---------|----------|
| Frontend | Netlify |
| Backend | Render |
| Database | MongoDB Atlas |

Environment variables are configured through platform secrets.

---

# Testing

Critical deterministic behaviours are covered:

- Requirement coverage validator
- Schedule allocator
- Kit structure validator
- Duplicate hash generation

Example:

```bash
npm test
```

---

# Creative Feature

## Knowledge Graph Flashcards

Instead of generating isolated flashcards every time, Intraowow introduces a reusable **Knowledge Layer**.

Each requirement maps to a `knowledge_slug`.

Example:

```
React Fiber
      │
      ├── Flashcard
      ├── Question
      └── Requirement
```

Benefits:

- Reuse across kits
- Progress survives regeneration
- Better long-term learning
- Smaller database duplication

This solves a real interview-prep problem: users often apply to multiple companies with overlapping technologies.

---

# Key Design Decisions

### 1. Deterministic scheduling over AI

Scheduling is arithmetic, not reasoning. Keeping it in JavaScript makes outputs reproducible and testable.

### 2. Two-pass generation

Rather than generating everything repeatedly, only uncovered requirements are regenerated. This dramatically reduces token usage.

### 3. Builder preserves user intent

Generated content is disposable; user edits are not. Regeneration operates only on AI-owned content.

### 4. Separate Flashcards from Progress

Learning state belongs to the user, not the interview kit.

---

# Known Limitations

- Public interview research depends on source availability.
- No email verification/password reset (intentionally out of scope).
- Confidence algorithm is simpler than SM-2 spaced repetition.
- Very large company websites are crawl-depth limited for free-tier latency.
- Vite SPA instead of Next.js (documented design choice).

---

# LLM Provider

**Provider:** Google Gemini

**Model:** Gemini 2.5 Flash

Chosen because:

- Free tier
- Fast structured JSON generation
- Reliable function-style prompting
- Suitable token limits for staged generation

---

# Author

**Harsh Sharma**

Built as the Trao Full-Stack Engineering Assessment.

The project emphasizes deterministic pipelines, transparent retrieval, resilient state management, and preserving user edits over maximizing AI output.