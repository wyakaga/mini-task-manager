# Mini Task Manager — Backend API (`be`)

Backend REST API for the Mini Task Manager application. Built with Node.js, Express, TypeScript, and Prisma ORM, designed to manage tasks with strict bidirectional state lifecycle progression and an append-only, immutable audit trail.

---

## Table of Contents

- [Features](#features)
- [Domain Rules & Invariants](#domain-rules--invariants)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Database Management](#database-management)
- [API Documentation](#api-documentation)
  - [Endpoints Overview](#endpoints-overview)
  - [Interactive Documentation (Swagger UI)](#interactive-documentation-swagger-ui)
  - [Detailed Endpoint Contracts](#detailed-endpoint-contracts)
- [Response & Error Formats](#response--error-formats)
- [Testing](#testing)

---

## Features

- **Task Management**: Full task management (creation, listing, status updates, and soft deletion).
- **Strict Bidirectional Lifecycle**: Guarantees task state transitions strictly move step-by-step between adjacent states.
- **Immutable Audit Logging**: Every valid status transition automatically records actor identity, source status, destination status, and timestamp.
- **ACID Transaction Safety**: Status transition and audit record insertion are executed atomically inside a Prisma transaction (`prisma.$transaction`).
- **Idempotent Transitions**: Submitting the current status returns the existing task without creating duplicate audit log entries.
- **Soft Deletion**: Tasks are flagged with a `deletedAt` timestamp; audit records are permanently retained for auditing and historical review.
- **OpenAPI 3.0 & Swagger UI**: Built-in interactive API documentation accessible via browser.
- **Strict Schema Validation**: All incoming route params, queries, and request bodies are validated using Zod.
- **Comprehensive Test Suite**: 36 automated unit and integration tests covering positive flows, boundary validations, and error states.

---

## Domain Rules & Invariants

### 1. Strict Status Progression
Status transitions must strictly follow bidirectional adjacent stages:

```
[todo] <---> [pending] <---> [in_progress] <---> [done]
```

- Tasks can move one step forward or backward to an adjacent status.
- Skipping steps (e.g. `todo` &rarr; `in_progress`, `done` &rarr; `pending`, `in_progress` &rarr; `todo`) is rejected with `400 Bad Request`.

### 2. Immutable Audit Trail
- Audit logs are **append-only**.
- There are no `UPDATE` or `DELETE` endpoints for audit logs.
- Every state change logs: `taskId`, `actor`, `fromStatus`, `toStatus`, and `timestamp`.

### 3. Soft Delete
- Deleting a task sets its `deletedAt` timestamp.
- Soft-deleted tasks are excluded from `GET /api/tasks` listings.
- Soft-deleted tasks cannot undergo further status transitions (`404 Not Found`).
- Audit logs of soft-deleted tasks remain accessible at `GET /api/tasks/:id/audit-logs`.

### 4. Idempotency & Transactions
- When a `PATCH /api/tasks/:id/status` request provides the exact status the task already has, the current task is returned immediately without creating duplicate audit log entries.
- Status update and audit log creation run in a single **Prisma interactive transaction** to prevent desynchronization.

---

## Tech Stack

- **Runtime:** Node.js (v18+)
- **Framework:** Express.js (v5)
- **Language:** TypeScript
- **Database ORM:** Prisma ORM (v7) with `@prisma/adapter-better-sqlite3`
- **Database:** SQLite (local zero-config file: `./dev.db`)
- **Validation:** Zod
- **Documentation:** Swagger UI Express, OpenAPI 3.0.3 specification
- **Testing:** Node.js built-in test runner (`node --test`)

---

## Project Architecture

The backend follows a layered architecture pattern:

```
be/
├── prisma/
│   ├── schema.prisma        # Prisma schema (Task, AuditLog, TaskStatus)
│   └── seed.ts              # Database seeder with sample data
├── src/
│   ├── controllers/         # Request handling & HTTP response mapping
│   │   └── task.controller.ts
│   ├── services/            # Core business logic & transaction handling
│   │   └── task.service.ts
│   ├── repositories/        # Database access layer using Prisma Client
│   │   └── task.repository.ts
│   ├── validators/          # Zod schemas for query, param, and body validation
│   │   └── task.validator.ts
│   ├── middlewares/         # Central error handling and schema validation middleware
│   │   ├── error.middleware.ts
│   │   └── validate.middleware.ts
│   ├── routes/              # Express route declarations
│   │   ├── index.ts
│   │   └── task.routes.ts
│   ├── docs/                # OpenAPI 3.0 specification & Swagger setup
│   │   └── swagger.ts
│   ├── lib/                 # Prisma client instance configuration
│   │   └── prisma.ts
│   ├── types/               # TypeScript interfaces and response types
│   │   ├── response.types.ts
│   │   └── task.types.ts
│   ├── app.ts               # Express application setup
│   └── server.ts            # Application server bootstrap & graceful shutdown
├── tests/                   # Integration and unit tests
│   ├── swagger.test.ts
│   ├── task.audit-log.test.ts
│   ├── task.create.test.ts
│   ├── task.delete.test.ts
│   └── task.status.test.ts
├── prisma.config.ts         # Prisma 7 CLI configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Scripts & dependencies
```

---

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

---

## Getting Started

### 1. Clone & Navigate
```bash
cd be
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

Default configuration:
```env
DATABASE_URL="file:./dev.db"
PORT=5000
```

### 4. Push Schema & Seed Database
Initialize the SQLite database file and populate seed data:
```bash
# Push Prisma schema to SQLite
npm run db:push

# Seed database with sample tasks and audit logs
npm run db:seed
```

### 5. Start Development Server
```bash
npm run dev
```

The server will be available at `http://localhost:5000`.

---

## Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | SQLite database connection string | `"file:./dev.db"` |
| `PORT` | Port number the HTTP server listens on | `5000` |

---

## Available Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `ts-node-dev -r tsconfig-paths/register --respawn --transpile-only src/server.ts` | Runs dev server with live-reloading |
| `npm run build` | `tsc && tsc-alias` | Compiles TypeScript and resolves path aliases to `dist/` |
| `npm start` | `node dist/src/server.js` | Runs the compiled production build |
| `npm run db:push` | `prisma db push` | Syncs Prisma schema with the local SQLite database |
| `npm run db:seed` | `ts-node -r tsconfig-paths/register prisma/seed.ts` | Seeds database with initial test tasks |
| `npm run db:studio` | `prisma studio` | Opens Prisma Studio web UI for database inspection |
| `npm test` | `npm run build && node --test dist/tests/**/*.test.js` | Builds the project and runs the test suite |

---

## Database Management

- **Database File**: The SQLite database file is generated at `be/dev.db`.
- **View Records Visually**: Run `npm run db:studio` to open Prisma Studio in your web browser at `http://localhost:5555`.
- **Reset Database**:
  ```bash
  rm dev.db
  npm run db:push
  npm run db:seed
  ```

---

## API Documentation

All API routes are prefixed with `/api`. Direct unprefixed endpoints return `404 Not Found`.

### Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status check |
| `GET` | `/api/docs` | Interactive Swagger UI documentation |
| `GET` | `/api/docs.json` | Raw OpenAPI 3.0.3 specification (JSON) |
| `GET` | `/api/tasks` | List non-deleted tasks with optional filter & pagination |
| `POST` | `/api/tasks` | Create a new task (initial status is always `todo`) |
| `PATCH` | `/api/tasks/:id/status` | Update task status (requires adjacent stage & actor) |
| `DELETE` | `/api/tasks/:id` | Soft-delete a task (`deletedAt` timestamp set) |
| `GET` | `/api/tasks/:id/audit-logs` | Retrieve chronological audit trail for a task |

---

### Interactive Documentation (Swagger UI)

Interactive API documentation with request-building capabilities is accessible at:
- `http://localhost:5000/api/docs` (also aliased at `/docs` and `/api-docs`)
- Raw JSON specification: `http://localhost:5000/api/docs.json`

---

### Detailed Endpoint Contracts

#### 1. Health Check
```http
GET /api/health
```
**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "status": "ok",
    "timestamp": "2026-10-11T06:30:00.000Z"
  }
}
```

---

#### 2. List Tasks
```http
GET /api/tasks?status=todo&q=review&page=1&limit=10
```

**Query Parameters:**
- `status` *(optional)*: Filter by status (`todo`, `pending`, `in_progress`, `done`).
- `q` *(optional)*: Case-insensitive search on title or description.
- `page` *(optional, default: `1`)*: Page number (positive integer).
- `limit` *(optional, default: `10`, max: `100`)*: Items per page.

**Response (200 OK):**
```json
{
  "status": "success",
  "data": [
    {
      "id": "e8b2b64d-58b2-4d56-a144-8cb38db31190",
      "title": "Design Database Schema",
      "description": "Create Prisma schema for tasks and audit logs",
      "status": "todo",
      "createdAt": "2026-10-10T12:00:00.000Z",
      "updatedAt": "2026-10-10T12:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

#### 3. Create Task
```http
POST /api/tasks
Content-Type: application/json

{
  "title": "Implement authentication middleware",
  "description": "JWT-based validation"
}
```

**Validation Rules:**
- `title` *(required)*: String (1–255 characters).
- `description` *(optional)*: String (max 2000 characters) or `null`. Empty strings are normalized to `null`.
- `status` *(optional)*: If supplied, must be `"todo"`.

**Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "id": "7fa57989-1a3b-4ca2-8a90-87efd93a6c9d",
    "title": "Implement authentication middleware",
    "description": "JWT-based validation",
    "status": "todo",
    "createdAt": "2026-10-11T06:35:00.000Z",
    "updatedAt": "2026-10-11T06:35:00.000Z"
  }
}
```

---

#### 4. Update Task Status
```http
PATCH /api/tasks/:id/status
Content-Type: application/json

{
  "status": "pending",
  "actor": "alice.smith"
}
```

**Validation Rules:**
- `:id`: Valid UUID v4.
- `status` *(required)*: Destination status (`todo`, `pending`, `in_progress`, `done`). Must be an adjacent status relative to current state.
- `actor` *(required)*: Non-empty string identifying who performed the action. Must be provided in the request body.

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id": "7fa57989-1a3b-4ca2-8a90-87efd93a6c9d",
    "title": "Implement authentication middleware",
    "description": "JWT-based validation",
    "status": "pending",
    "createdAt": "2026-10-11T06:35:00.000Z",
    "updatedAt": "2026-10-11T06:36:00.000Z"
  }
}
```

**Invalid Transition Error (400 Bad Request):**
```json
{
  "status": "error",
  "message": "Invalid status transition from 'todo' to 'in_progress'. Status must transition strictly between adjacent states (todo <-> pending <-> in_progress <-> done)."
}
```

---

#### 5. Soft-Delete Task
```http
DELETE /api/tasks/:id
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Task deleted successfully"
}
```

---

#### 6. Retrieve Task Audit Logs
```http
GET /api/tasks/:id/audit-logs
```

Returns all state transitions for the specified task ordered chronologically (`timestamp ASC`).

**Response (200 OK):**
```json
{
  "status": "success",
  "data": [
    {
      "id": "111c1d0a-9bc6-42d4-bb35-430aa39ff187",
      "taskId": "7fa57989-1a3b-4ca2-8a90-87efd93a6c9d",
      "actor": "alice.smith",
      "fromStatus": "todo",
      "toStatus": "pending",
      "timestamp": "2026-10-11T06:36:00.000Z"
    },
    {
      "id": "222d2e1b-0cd7-53e5-cc46-541bb400a298",
      "taskId": "7fa57989-1a3b-4ca2-8a90-87efd93a6c9d",
      "actor": "john.doe",
      "fromStatus": "pending",
      "toStatus": "in_progress",
      "timestamp": "2026-10-11T06:40:00.000Z"
    }
  ]
}
```

---

## Response & Error Formats

### Success Response Envelope
```json
{
  "status": "success",
  "data": { ... },
  "meta": { ... } // Optional for paginated collections
}
```

### Error Response Envelope
```json
{
  "status": "error",
  "message": "Human readable error description",
  "details": [ ... ] // Optional Zod validation issues
}
```

---

## Testing

The project uses the Node.js built-in test runner (`node --test`). Tests compile the TypeScript files and verify HTTP status codes, schema validation, transaction boundaries, idempotent calls, and soft deletion.

Run all tests:
```bash
npm test
```

### Test Coverage Highlights:
- **Swagger Documentation**: Validates UI HTML endpoints (`/api/docs`, `/docs`, `/api-docs`) and JSON spec endpoints (`/api/docs.json`).
- **Task Creation**: Title validation, empty description normalization, non-todo status rejection.
- **Status Lifecycle**: Linear progression (`todo` &rarr; `pending` &rarr; `in_progress` &rarr; `done`), backward progression, rejection of skipped stages, idempotency validation, actor requirement.
- **Soft Deletion**: Soft delete timestamp verification, exclusion from `GET /api/tasks`, subsequent transition rejection, preservation of audit history.
- **Audit Logging**: Empty initial logs, ascending chronological sorting, audit preservation on soft delete.
