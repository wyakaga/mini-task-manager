# AGENTS.md — Backend (`be`)

## Project Context
Mini Task Manager Backend API built for an internal task tracking tool. The primary objective is to manage tasks and provide an immutable, chronological audit trail recording state transitions.

## Tech Stack & Core Libraries
- **Runtime & Framework:** Node.js, Express, TypeScript
- **Database ORM:** Prisma ORM (SQLite for zero-config local runs or PostgreSQL)
- **Validation & Parsing:** Zod
- **Architecture:** Layered pattern (`controllers/`, `services/`, `repositories/`, `validators/`, `types/`)

---

## Non-Negotiable Domain Rules & Invariants

1. **Strict Status Lifecycle Progression:**
   Status transitions must strictly follow bidirectional adjacent stages:
   `todo` <-> `pending` <-> `in_progress` <-> `done`
   - Tasks may move one step forward or one step backward to adjacent statuses.
   - Any attempt to skip steps (e.g., `todo` -> `in_progress`, `done` -> `pending`, `in_progress` -> `todo`) must be rejected with HTTP 400 Bad Request.

2. **Audit Log Immutability & Persistence:**
   - Audit logs are **append-only**. Never create `UPDATE` or `DELETE` endpoints or Prisma mutations for audit logs.
   - Every valid status change MUST generate an audit log record containing: `taskId`, `actor`, `fromStatus`, `toStatus`, and `timestamp`.
   - Task deletion uses **soft delete** (`deletedAt` timestamp). Task records are not physically removed, preserving all associated audit logs intact. Soft-deleted tasks are excluded from `GET /tasks` listings and cannot undergo status transitions.

3. **Idempotency & Consistency:**
   - If an update requests the exact same status the task already possesses, return the existing task immediately and **do not** write an audit log entry.
   - The status update and audit log insertion MUST execute within a single **Prisma interactive transaction** (`prisma.$transaction`) to prevent desynchronization.

4. **Actors:**
   - No complex authentication required.
   - Accept `actor` from request body. Validate against a non-empty string using Zod.

---

## API Specifications

All API routes are uniformly prefixed with `/api`. Direct unprefixed endpoints return `404 Not Found`.

- `GET /api/health` — Health check endpoint.
- `GET /api/tasks` — List all active (non-deleted) tasks. Supports `status`, `q`, `page`, and `limit` queries.
- `POST /api/tasks` — Create a task (Initial status: `todo`).
- `PATCH /api/tasks/:id/status` — Transition task status. Requires `status` and `actor` in request body.
- `DELETE /api/tasks/:id` — Soft-delete a task (`deletedAt` set to timestamp).
- `GET /api/tasks/:id/audit-logs` — Retrieve chronological audit history for a task (`ORDER BY timestamp ASC`).
- `GET /api/docs` (or `/docs`, `/api-docs`) — Interactive Swagger UI documentation.
- `GET /api/docs.json` (or `/docs.json`, `/api-docs.json`) — Raw OpenAPI 3.0.3 JSON specification.

---

## Coding Standards for AI Agents
- **Validation:** Always validate incoming payloads (`req.body`, `req.params`, `req.query`) using Zod schemas before passing data to services.
- **Error Handling:** Centralize error handling in an Express error middleware. Return consistent JSON error shapes: `{ "error": string, "details"?: unknown }`.
- **Transactions:** Always wrap task status updates + audit log creation inside `prisma.$transaction(async (tx) => { ... })`.
- **Typing:** Strict TypeScript. Avoid `any`. Derive types from Zod schemas (`z.infer<typeof Schema>`) or Prisma models.
- **Avoid Overengineering:** Do not implement JWT, refresh tokens, role-based access control (RBAC), or microservices. Keep it simple, clean, and testable.
- **Avoid Excessive Comments:** Only comment when it's necessary (e.g why this function write this way etc)

---

## Common Verification Commands
- `npm run build` or `npx tsc --noEmit` — Type-check backend.
- `npx prisma migrate dev` / `npx prisma db push` — Apply database schema updates.
- `npx prisma studio` — Inspect tasks and audit log tables.
- `npm test` — Run unit and integration tests.