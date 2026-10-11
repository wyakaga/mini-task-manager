# AGENTS.md — Frontend (`fe`)

## Project Context
Internal Mini Task Manager UI. Designed to help teams track simple tasks and clearly visualize who changed what, the exact state transitions, and the chronological change history.

## Tech Stack & Core Libraries
- **Framework:** React + TypeScript (Vite recommended)
- **UI Component Library:** HeroUI (formerly NextUI)
- **Icons & Styling:** Tailwind CSS, react-icons
- **State Management & Data Fetching:** React Query (`@tanstack/react-query`) and Axios (`axios`)
- **Schema & Form Validation:** Zod

---

## Core Features & UX Requirements

1. **Task Management UI:**
   - **Task List:** Clean view of all tasks with badges showing status (`to_do`, `pending`, `in_progress`, `done`).
   - **Task Creation:** Simple modal or inline form (Title, Description).
   - **Task Deletion:** Accessible delete button per task with a confirmation prompt.

2. **Status Progression Controls:**
   - Task status transitions must follow: `to_do` -> `pending` -> `in_progress` -> `done`.
   - The UI should clearly indicate the next eligible status (e.g., dropdown showing valid next transitions, or a direct "Advance Status" action button).
   - Include an **Actor Selector** (a dropdown populated with predefined users such as `alice.smith`, `john.doe`, `bob.jones`) so actions are tied to a simulated user.

3. **Audit Log Inspection:**
   - Allow users to view the audit history for any selected task via a **HeroUI Modal**, **HeroUI Accordion**, or an expandable panel.
   - Audit logs must be displayed in **chronological order** (oldest to newest, or clear timeline format).
   - Format: `User "[actor]" changed status from [fromStatus] to [toStatus] at [Formatted Date/Time]`.

---

## Coding Standards for AI Agents
- **Component System:** Rely on **HeroUI** primitives (`Button`, `Card`, `Modal`, `Select`, `Chip`, `Table`, `Input`) to maintain visual consistency without bloated custom CSS.
- **Strict Typing:** All task and audit log types must match backend API responses.
- **Optimistic or Synchronized Updates:** Invalidate queries or refresh task data and audit logs immediately upon status changes.
- **Edge Cases & Empty States:** Always render accessible loading skeletons(using **HeroUI component**) and clean empty states (e.g., "No audit logs found for this task").
- **Simplicity:** Keep state management local or lightweight. Do not introduce complex Redux setups or unnecessary state abstraction.
- **Avoid Excessive Comments:** Only comment when it's necessary (e.g why this function write this way etc)

## Code Conventions (Non-negotiable)

- **Naming**:
  - Components: `PascalCase`
  - Component file: `ComponentName.tsx`
  - Hook: `useCamelCase.ts`
  - Type/interface: `IPascalCase` or `TPascalCase` (for response/request use: `IPascalCaseRes`/`IPascalCaseReq`)
- **Export**: Prefer named exports over default exports.
- **CSS**: Tailwind utility classes, avoid `!important`. Use `cn()` from `@heroui/react`.

---

## Common Verification Commands
- `npm run dev` — Start the local development server.
- `npm run build` or `npx tsc --noEmit` — Verify TypeScript and bundling integrity.
- `npm run lint` — Lint checking.