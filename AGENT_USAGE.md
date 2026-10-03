# Agent Usage & AI Collaboration Log

## 1. Tools & Environment
- **Development Environment**: Antigravity IDE, Next.js 16 (App Router), TypeScript, Tailwind CSS, Vitest.
- **AI Assistance**: AI tools were leveraged for rapid boilerplate structure, test suite definitions, and edge-case boundary checks.

## 2. Representative Prompts & Delegated Work
- **Deterministic Date Engine**: Delegated calendar date subtractions (date-fns) and boundary edge cases (2024-02-29, 2025-02-28, zero-day notice) to pure unit-tested TypeScript functions rather than non-deterministic LLM calculations.
- **Human-in-the-Loop Workbench**: Delegated state management logic for review workflows (Approve, Reject, Inline Edit, Ambiguity Clarification) and automatic stale-item flagging on version drift.
- **Verbatim Citations**: Enforced direct clause citations (sourceSection) rather than synthetic summaries.

## 3. Important Agent Mistakes & Rejected Suggestions
- **LLM-Based Date Arithmetic**: An initial suggestion proposed calculating deadline notice dates using the LLM prompt. This was rejected in favor of a deterministic date math engine using date-fns to eliminate calculation hallucination.
- **Silent State Overwrite**: An automated prompt suggested replacing existing user edits when uploading a new document version. This was rejected in favor of marking items as stale with visual banners so reviewers maintain manual control.

## 4. Output Verification Strategy
- **Automated Tests**: Vitest suite (npm test) with 10 passing unit tests verifying date math, leap years, and drift.
- **Type & Linter Checks**: npm run lint passing with 0 warnings/errors and npm run build compiling cleanly with Turbopack.
- **End-to-End Walkthrough**: Verified extraction, clarification prompts, notice date calculation, and drift flags in the browser.
