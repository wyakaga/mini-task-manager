# Mini Task Manager — Frontend (`fe`)

Modern, responsive Kanban board web application for the Mini Task Manager. Built with React 19, TypeScript, Vite, HeroUI, Tailwind CSS, and TanStack React Query. Features drag-and-drop task progression, strict adjacent-state validation, simulated actor attribution, and chronological audit trail inspection.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Application Flow & Key Features](#application-flow--key-features)
  - [1. Kanban Board & Adjacent State Transitions](#1-kanban-board--adjacent-state-transitions)
  - [2. Actor Attribution](#2-actor-attribution)
  - [3. Chronological Audit Trail Timeline](#3-chronological-audit-trail-timeline)
  - [4. Task Creation & Soft Deletion](#4-task-creation--soft-deletion)
  - [5. Debounced Search & Filtering](#5-debounced-search--filtering)
- [State Management & Data Synchronization](#state-management--data-synchronization)
- [Linting & Code Standards](#linting--code-standards)

---

## Features

- **4-Stage Kanban Board**: Visual workflow covering **To Do**, **Pending**, **In Progress**, and **Done**.
- **Drag-and-Drop Interaction**: Drag tasks between columns with automatic transition validation and drop handling.
- **Strict Progression Enforcement**: Tasks can only move to adjacent stages (`To Do` &harr; `Pending` &harr; `In Progress` &harr; `Done`). Invalid non-adjacent moves are blocked with descriptive notifications.
- **Actor Attribution**: Select simulated team members (`Alice Smith`, `John Doe`, `Bob Jones`, or custom name) when advancing task stages to maintain an auditable paper trail.
- **Audit History Accordion**: Each task card contains an expandable chronological activity timeline detailing who changed what status, from which state, and at what timestamp.
- **Search & Filter**: Real-time search with a 300ms debounce filter across task titles and descriptions.
- **Accessible UI & Design System**: Built with **HeroUI** component primitives and **Tailwind CSS v4** tokens, featuring subtle scrollbars, custom status chips, and animated loading skeletons.
- **Toast Notifications**: Contextual notifications for task creation, movement, deletion, and validation errors via HeroUI `ToastProvider`.

---

## Tech Stack

- **Framework:** React 19 (`react`, `react-dom`)
- **Build Tool:** Vite 8
- **Language:** TypeScript
- **UI Components:** HeroUI (`@heroui/react` v3)
- **Styling:** Tailwind CSS (v4) with `@tailwindcss/vite`
- **Data Fetching & Caching:** TanStack React Query (`@tanstack/react-query` v5)
- **HTTP Client:** Axios (`axios` v1.20)
- **Icons:** React Icons (`react-icons` v5)
- **Schema & Env Validation:** Zod

---

## Project Architecture

```
fe/
├── public/                 # Static public assets
├── src/
│   ├── assets/             # Images and SVG icons
│   ├── components/         # HeroUI modular components
│   │   ├── AdvanceTaskModal.tsx    # Modal to transition task status with actor selector
│   │   ├── AuditTimeline.tsx       # Chronological activity history accordion & badges
│   │   ├── CreateTaskModal.tsx     # Modal form to create new tasks
│   │   ├── DeleteConfirmModal.tsx  # Confirmation dialog for task deletion
│   │   ├── KanbanColumn.tsx        # Column layout with drop zone and task list
│   │   ├── TaskCard.tsx            # Individual task card with drag handle & actions
│   │   ├── TaskCardSkeleton.tsx    # HeroUI skeleton placeholders during fetch
│   │   └── WorkspaceOverview.tsx   # Top header, search input, and action bar
│   ├── config/             # Runtime environment configuration & validation
│   │   └── env.ts          # Zod schema for import.meta.env
│   ├── interfaces/         # Strongly-typed API request & response interfaces
│   │   ├── requests/
│   │   │   └── task.interface.ts
│   │   └── responses/
│   │       ├── base.interface.ts
│   │       └── task.interface.ts
│   ├── lib/
│   │   └── axios/          # Configured Axios instance with base URL & interceptors
│   │       └── axios.ts
│   ├── services/
│   │   ├── tasks/          # React Query query/mutation hooks & Axios endpoints
│   │   │   ├── api.ts
│   │   │   └── index.ts
│   │   └── audit-logs/     # Audit log queries
│   ├── types/
│   │   └── kanban.ts       # Kanban board types, status-to-stage mappings & helpers
│   ├── App.tsx             # Main application layout and modal state orchestration
│   ├── index.css           # Global stylesheet and Tailwind directives
│   └── main.tsx            # Application entry point with Providers (QueryClient, HeroUI)
├── .env.example            # Environment variables template
├── eslint.config.js        # ESLint configuration
├── tsconfig.json           # Root TypeScript configuration
├── tsconfig.app.json       # App TypeScript configuration
├── vite.config.ts          # Vite configuration with Tailwind CSS plugin
└── package.json            # Scripts & dependencies
```

---

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- Running instance of the backend API (`be`) on `http://localhost:5000`

---

## Getting Started

### 1. Clone & Navigate
```bash
cd fe
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Ensure the configuration points to your backend instance:
```env
VITE_API_BASE_URL="http://localhost:5000/api"
VITE_API_TIMEOUT=10000
```

### 4. Start Development Server
```bash
npm run dev
```

Open your browser at `http://localhost:5173` (or the URL displayed in the terminal).

---

## Environment Variables

Environment variables are validated on startup with Zod in `src/config/env.ts`:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL of the backend REST API | `"http://localhost:5000/api"` |
| `VITE_API_TIMEOUT` | Axios request timeout in milliseconds | `10000` |

---

## Available Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `vite` | Starts local development server with Hot Module Replacement |
| `npm run build` | `tsc -b && vite build` | Type-checks with TypeScript and compiles production bundle to `dist/` |
| `npm run preview` | `vite preview` | Locally serves the compiled production build |
| `npm run lint` | `eslint .` | Runs ESLint across the codebase |

---

## Application Flow & Key Features

### 1. Kanban Board & Adjacent State Transitions
The board represents four distinct stages:
- **To Do** (`todo`)
- **Pending** (`pending`)
- **In Progress** (`in_progress`)
- **Done** (`done`)

Transitions are enforced both in UI drag-and-drop actions and manual modal triggers:
- `To Do` &harr; `Pending`
- `Pending` &harr; `In Progress`
- `In Progress` &harr; `Done`

Attempting to skip stages (e.g. `To Do` &rarr; `In Progress`) will immediately display a danger toast and prevent invalid backend mutation requests.

### 2. Actor Attribution
When moving a task via drag-and-drop or clicking **"Advance"**, the `AdvanceTaskModal` opens with:
- Selected destination stage (locked to valid adjacent stages)
- **Actor selection dropdown** with preset team members:
  - `alice.smith` (Alice Smith)
  - `john.doe` (John Doe)
  - `bob.jones` (Bob Jones)
- An option for custom actor names.

This ensures every single status change in the system is tied to an accountable team member.

### 3. Chronological Audit Trail Timeline
Inside each `TaskCard`, clicking **"Activity Log"** expands the `AuditTimeline` accordion:
- Fetches chronological history via `GET /api/tasks/:id/audit-logs`.
- Displays actor name, formatted timestamp, and transition badge (e.g., `todo → pending`, `pending → in_progress`).
- Shows pulsing HeroUI skeletons while loading.
- Displays an empty state message for newly created tasks with no historical transitions yet.

### 4. Task Creation & Soft Deletion
- **Create Task**: Clicking the **"Create Task"** button opens `CreateTaskModal`. New tasks are automatically initialized in the `To Do` stage.
- **Delete Task**: Clicking the delete icon opens `DeleteConfirmModal`. Confirming soft-deletes the task on the backend and removes it from the Kanban view while preserving its audit history on the server.

### 5. Debounced Search & Filtering
The search bar in `WorkspaceOverview` allows quick filtering across all columns. A 300ms debounce ensures smooth typing performance without redundant network requests or UI re-renders.

---

## State Management & Data Synchronization

Data fetching and caching are managed with **TanStack React Query**:

1. **Automatic Invalidation**: Whenever a task is created, advanced, or deleted, relevant React Query keys (`["tasks"]` and `["audit-logs", taskId]`) are automatically invalidated to immediately reflect updated state.
2. **Optimistic & Resilient Feedback**: Toast notifications provide real-time status updates and display server validation error messages if an operation fails.
3. **Decoupled API Layer**: All API communication is encapsulated in `src/services/tasks/api.ts` and cleanly exposed through custom React Query hooks in `src/services/tasks/index.ts`.

---

## Linting & Code Standards

- **Type Safety**: No `any` types; all API payload shapes conform to `src/interfaces/`.
- **Component Architecture**: Built using pure functional components with named exports.
- **Component Primitives**: Styled with HeroUI components (`Button`, `Modal`, `Accordion`, `Skeleton`, `Input`, `Select`, `Chip`).
- **Path Aliasing**: Imports use `@/` alias mapped directly to `src/`.

Run lint checks:
```bash
npm run lint
```
