# Qonflo Mini Task Manager

Aplikasi Mini Task Manager dengan Kanban Board interaktif, validasi transisi status sekuensial dua arah (*bidirectional adjacent lifecycle*), dan pencatatan riwayat audit (*audit log*) yang *append-only* dan *immutable*.

Repo ini terdiri dari dua bagian utama:
- **`be/`**: Backend REST API (Node.js, Express 5, TypeScript, Prisma ORM, SQLite, Zod, OpenAPI/Swagger).
- **`fe/`**: Frontend Single Page Application (React 19, TypeScript, Vite, HeroUI, Tailwind CSS v4, TanStack React Query v5).

---

## Daftar Isi

1. [Cara Menjalankan Frontend & Backend](#1-cara-menjalankan-frontend--backend)
   - [Prasyarat](#prasyarat)
   - [Menjalankan Backend (`be`)](#menjalankan-backend-be)
   - [Menjalankan Frontend (`fe`)](#menjalankan-frontend-fe)
2. [Penjelasan Singkat Arsitektur](#2-penjelasan-singkat-arsitektur)
3. [Asumsi yang Diambil](#3-asumsi-yang-diambil)
4. [Trade-off yang Dibuat](#4-trade-off-yang-dibuat)
5. [Jika Ada Waktu Lebih, Apa yang Akan Diperbaiki](#5-jika-ada-waktu-lebih-apa-yang-akan-diperbaiki)
6. [Pertanyaan Teknis Khusus](#6-pertanyaan-teknis-khusus)
   - [Bagaimana Memastikan Audit Log Tidak Ter-modifikasi?](#a-bagaimana-memastikan-audit-log-tidak-ter-modifikasi)
   - [Bagian Solusi yang Paling Berisiko Jika Digunakan oleh Banyak User?](#b-bagian-solusi-yang-paling-berisiko-jika-digunakan-oleh-banyak-user)
   - [Bagian yang Akan Direfactor Terlebih Dahulu untuk Sistem Berskala Besar](#c-bagian-yang-akan-direfactor-terlebih-dahulu-untuk-sistem-berskala-besar)
   - [Penggunaan AI dan Metode Validasinya](#d-penggunaan-ai-dan-metode-validasinya)

---

## 1. Cara Menjalankan Frontend & Backend

### Prasyarat
- **Node.js**: versi `18.x` atau lebih baru
- **npm**: versi `9.x` atau lebih baru

---

### Menjalankan Backend (`be`)

1. **Masuk ke direktori backend:**
   ```bash
   cd be
   ```

2. **Install dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables:**
   Salin berkas `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   *Isi default `.env`:*
   ```env
   DATABASE_URL="file:./dev.db"
   PORT=5000
   ```

4. **Sinkronisasi Database & Seeding Data:**
   Inisialisasi skema tabel SQLite dan isi data awal:
   ```bash
   # Push schema Prisma ke database SQLite
   npm run db:push

   # Jalankan seeder (membuat 5 sample tasks dan 6 audit logs)
   npm run db:seed
   ```

5. **Jalankan Backend Server:**
   ```bash
   npm run dev
   ```
   Backend aktif di: `http://localhost:5000`
   - Base API: `http://localhost:5000/api`
   - Dokumentasi Interaktif Swagger UI: `http://localhost:5000/api/docs`
   - Raw OpenAPI Spec: `http://localhost:5000/api/docs.json`

6. **Menjalankan Test Otomatis (Opsional):**
   ```bash
   npm test
   ```
   *(Menjalankan 36 skenario integration & unit test menggunakan Node.js test runner)*.

---

### Menjalankan Frontend (`fe`)

1. **Buka terminal baru dan masuk ke direktori frontend:**
   ```bash
   cd fe
   ```

2. **Install dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables:**
   Salin berkas `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   *Isi default `.env`:*
   ```env
   VITE_API_BASE_URL="http://localhost:5000/api"
   VITE_API_TIMEOUT=10000
   ```

4. **Jalankan Frontend Development Server:**
   ```bash
   npm run dev
   ```
   Buka peramban pada alamat: `http://localhost:5173` (atau port yang tertera di terminal).

5. **Build & Lint Verification (Opsional):**
   ```bash
   npm run lint   # Memeriksa standar kode ESLint
   npm run build  # Type-check TypeScript & bundel Vite production
   ```

---

## 2. Penjelasan Singkat Arsitektur

Aplikasi ini menggunakan pola arsitektur **Client-Server terpisah (Decoupled Monorepo Structure)** dengan pemisahan tanggung jawab yang tegas:

```
[ Browser / Client ]
        │
   (React 19 + HeroUI + React Query)
        │  HTTP / JSON (/api)
        ▼
[ Express 5 REST API Router ]
        │
┌───────┴───────────────────────────────────────────┐
│ Middlewares: CORS, Express.json, Zod Validation   │
├───────────────────────────────────────────────────┤
│ Controllers: HTTP Request parsing & Response JSON │
├───────────────────────────────────────────────────┤
│ Services: State Machine Validation & Transactions │
├───────────────────────────────────────────────────┤
│ Repositories: Database Queries (Prisma ORM)       │
└───────┬───────────────────────────────────────────┘
        ▼
[ SQLite Database (dev.db) ]
  ├── tasks (id, title, description, status, deletedAt, ...)
  └── audit_logs (id, taskId, actor, fromStatus, toStatus, timestamp)
```

### Backend (`be`) — Layered Architecture
- **Routing Layer (`src/routes/`)**: Menerima request HTTP dengan prefix seragam `/api`.
- **Validation Middleware (`src/middlewares/validate.middleware.ts`)**: Memvalidasi seluruh request body, query params, dan route params menggunakan skema **Zod** sebelum mencapai controller.
- **Controller Layer (`src/controllers/`)**: Mengatur parsing input dan membungkus data ke dalam format envelope respons JSON seragam (`{ status, data, meta }` atau `{ status, message, details }`).
- **Service Layer (`src/services/`)**: Inti logika bisnis. Menegakkan aturan transisi status (`todo` $\leftrightarrow$ `pending` $\leftrightarrow$ `in_progress` $\leftrightarrow$ `done`), mengecek sifat idempotent, dan membungkus mutasi status beserta pembuatan audit log dalam transaksi database atomik.
- **Repository Layer (`src/repositories/`)**: Mengabstraksi operasi basis data langsung ke Prisma Client.
- **Database Engine**: Prisma ORM v7 dengan `@prisma/adapter-better-sqlite3` dan SQLite lokal (`dev.db`).

### Frontend (`fe`) — Component-Driven Architecture
- **State Management & Server Cache**: Menggunakan `@tanstack/react-query` untuk caching data server, auto-refetch, dan pembaruan instan (*query invalidation*) saat terjadi mutasi.
- **UI Components**: Dibangun menggunakan komponen primitif **HeroUI** (`Modal`, `Accordion`, `Skeleton`, `Select`, `Button`, `ToastProvider`) dan utility styling **Tailwind CSS v4**.
- **Interactive Kanban Board**: 4 kolom sekuensial dengan dukungan drag-and-drop, validasi transisi lokal dengan umpan balik visual, modal pemilihan aktor, dan timeline accordion histori audit di tiap kartu task.

---

## 3. Asumsi yang Diambil

1. **Simulasi Aktor tanpa Autentikasi Kompleks**:
   Sesuai konteks sistem pelacak tugas internal berskala kecil (*mini task tracker*), sistem tidak menerapkan sistem login penuh (JWT, OAuth, atau Session Cookies). Aktor dikirimkan sebagai string non-kosong di dalam *request body* (`actor`), dan frontend menyediakan input custom.
2. **Siklus Status Dua Arah yang Bersebelahan (*Bidirectional Adjacent Stages*)**:
   Alur status harus bergerak satu langkah maju atau satu langkah mundur:
   `todo` $\leftrightarrow$ `pending` $\leftrightarrow$ `in_progress` $\leftrightarrow$ `done`.
   Lompatan tahapan (misal `todo` langsung ke `in_progress`, atau `done` langsung ke `pending`) dianggap tidak valid dan ditolak dengan status HTTP `400 Bad Request`.
3. **Audit Log Bersifat Append-Only & Idempotent**:
   Setiap perubahan status yang valid wajib dicatat ke dalam audit log. Namun, jika ada request update dengan status yang sama dengan status saat ini (*idempotent update*), sistem mengembalikan task yang ada tanpa menuliskan record log baru.
4. **Soft Deletion untuk Integritas Histori**:
   Penghapusan task menggunakan *soft delete* (`deletedAt` diisi timestamp). Data task tidak dihapus dari basis data agar relasi histori audit log di masa lalu tetap utuh dan dapat diaudit kapan saja. Task yang sudah di-soft-delete tidak ditampilkan di list kanban dan tidak dapat diubah statusnya lagi.
5. **Database SQLite Lokal untuk Kemudahan Evaluasi**:
   Penggunaan SQLite (`file:./dev.db`) diasumsikan optimal untuk evaluasi lokal *zero-configuration* tanpa keharusan menyalakan daemon Docker atau database server terpisah.

---

## 4. Trade-off yang Dibuat

| Pilihan Solusi | Keuntungan (Pros) | Konsekuensi / Trade-off (Cons) |
| :--- | :--- | :--- |
| **SQLite (File-based DB)** | Zero-config, sangat ringan, siap pakai saat clone tanpa setup Docker/Postgres. | Bersifat file-level lock untuk operasi tulis (*single-writer*). Kurang cocok untuk beban konkuren *high-write* multi-instance. |
| **Actor via Request Body** | Mudah diuji, tidak ada dependensi token/session, fleksibel mengganti aktor di UI. | Tidak ada verifikasi kriptografis; siapa pun yang memanggil API dapat memalsukan nama aktor (*no identity guarantee*). |
| **React Query Cache Invalidation vs WebSockets** | Implementasi bersih, minim kompleksitas arsitektur, mudah di-maintain dan bebas koneksi *dangling*. | Bukan *real-time push*. Perubahan yang dilakukan user lain di tab berbeda baru tersinkronisasi saat refetch, window focus, atau aksi lokal. |
| **State Machine di Service Layer (Code-level)** | Validasi berbasis TypeScript & Zod sangat fleksibel, mudah dibuatkan unit test mendalam. | Jika ada mutasi langsung ke database (misal via Prisma Studio atau raw SQL script), aturan adjacent tidak dipaksakan di level database trigger. |
| **Optimistic Feedback via Toast vs Optimistic State Mutation** | Mencegah anomali UI jika transisi status ditolak server (state tetap konsisten dengan DB). | Kartu tidak berpindah tempat sebelum respons server diterima (ada latency jaringan singkat beberapa milidetik). |

---

## 5. Jika Ada Waktu Lebih, Apa yang Akan Diperbaiki

1. **Sinkronisasi Real-Time Menggunakan WebSockets / SSE**:
   Menambahkan Server-Sent Events (SSE) atau WebSocket agar pergerakan kartu Kanban dan audit log otomatis terupdate secara live di layar seluruh pengguna tanpa perlu reload/refetch.
2. **Optimistic UI Updates pada Drag-and-Drop**:
   Memindahkan posisi kartu secara instan di UI saat dilepas (*drop*), dengan mekanisme *rollback* otomatis jika server mengembalikan error.
3. **Migrasi ke PostgreSQL & Multi-Environment Setup**:
   Menyediakan konfigurasi Docker Compose (`docker-compose.yml`) dengan database PostgreSQL, pooling koneksi via PgBouncer, dan migrasi terstruktur (`prisma migrate dev`).
4. **Sistem Autentikasi & RBAC Sesungguhnya**:
   Menerapkan otentikasi berbasis JWT / OAuth 2.0 sehingga identitas `actor` diambil secara aman langsung dari `req.user.id`, bukan dari payload body yang dapat dimanipulasi.
5. **Fitur Filter & Pencarian Lanjutan**:
   - Filter kartu berdasarkan aktor terakhir, rentang tanggal pembuatan, atau status.
   - Fitur ekspor histori audit ke format CSV / PDF.
6. **End-to-End (E2E) Testing**:
   Menambahkan pengujian browser otomatis menggunakan Playwright atau Cypress untuk memverifikasi interaksi drag-and-drop antar kolom dan verifikasi modal.

---

## 6. Pertanyaan Teknis Khusus

### A. Bagaimana kamu memastikan audit log tidak ter-modifikasi?

Untuk menjamin audit log bersifat **kekal (*immutable*)** dan **hanya bisa ditambah (*append-only*)**, proteksi diterapkan di beberapa lapisan:

1. **Tidak Ada Endpoint Mutasi untuk Audit Log**:
   Di level routing Express, sistem sama sekali tidak menyediakan endpoint `PUT`, `PATCH`, atau `DELETE` untuk entitas `audit_logs`. API publik hanya menyediakan endpoint pembacaan data: `GET /api/tasks/:id/audit-logs`.
2. **Isolasi Repository & Service Layer**:
   Di layer kode (`task.repository.ts` dan `task.service.ts`), tidak ada method yang melakukan `prisma.auditLog.update()` atau `prisma.auditLog.delete()`. Satu-satunya operasi adalah `.create()` saat transisi status berlangsung.
3. **Transaksi Atomik Database (`prisma.$transaction`)**:
   Penulisan log status dan pembaruan tabel `tasks` dijalankan di dalam satu transaksi interaktif Prisma:
   ```typescript
   await prisma.$transaction(async (tx) => {
     const updatedTask = await tx.task.update({ ... });
     await tx.auditLog.create({ ... });
     return updatedTask;
   });
   ```
   Hal ini menjamin integritas data: status task tidak mungkin berubah tanpa pencatatan audit log, dan audit log tidak mungkin tercipta jika update task gagal.
4. **Soft Delete pada Task Mencegah Penghapusan Kaskade**:
   Ketika task dihapus, sistem hanya menandai kolom `deletedAt`. Data task fisik tetap ada, sehingga relasi foreign key pada `audit_logs` tidak pernah terhapus karena cascading delete.

---

### B. Bagian mana dari solusi ini yang paling berisiko jika digunakan oleh banyak user?

1. **Kondisi Perlombaan Status (*Race Condition / Concurrent Status Updates*)**:
   - **Skenario:** Dua pengguna membuka task yang sama pada status `todo`. Secara hampir bersamaan, Pengguna A memindahkan task ke `pending`, dan Pengguna B juga memindahkan task ke `pending` (atau mencoba memindahkannya ke status lain berdasarkan data usang).
   - **Risiko:** Tanpa mekanisme penguncian baris (*pessimistic locking* seperti `SELECT FOR UPDATE`) atau *Optimistic Concurrency Control* (kolom `version`), verifikasi adjacent status dapat membaca state yang sudah basi (*stale read*), berpotensi mengakibatkan anomali histori atau duplikasi log audit yang tidak berurutan.
2. **Keterbatasan Konkurensi Tulis SQLite (*Write Lock Bottleneck*)**:
   - SQLite bekerja menggunakan penguncian berkas (*file lock*). Meskipun mode WAL (*Write-Ahead Logging*) memfasilitasi pembacaan konkuren, operasi penulisan (*write transaction*) tetap dilakukan secara bergantian (*single writer*).
   - Di bawah ratusan atau ribuan request tulis simultan, proses akan mengalami antrean panjang dan memicu galat `SQLITE_BUSY: database is locked`.
3. **Ketiadaan Validasi Identitas Kriptografis (*Actor Impersonation*)**:
   - Karena nama aktor dikirim secara bebas di payload body tanpa verifikasi token/session, user yang tidak bertanggung jawab dapat mengirimkan nama aktor lain secara sepihak untuk memanipulasi atribusi audit log.

---

### C. Jika task ini berkembang menjadi sistem besar, bagian mana yang akan kamu refactor terlebih dahulu dan kenapa?

Bagian yang akan di-refactor terlebih dahulu adalah:

#### 1. Arsitektur Basis Data & Concurrency Control (Prioritas #1)
- **Yang di-refactor:**
  - Migrasi engine dari SQLite ke **PostgreSQL**.
  - Mengimplementasikan **Optimistic Concurrency Control (OCC)** dengan menambahkan kolom `version: Int` pada model `Task`.
- **Kenapa:**
  Integritas alur transisi status adalah nilai jual utama dari sistem ini. Pada sistem berskala besar, konflik pembaruan status oleh multi-pengguna adalah hal yang tak terelakkan. Dengan OCC:
  ```typescript
  // Update hanya berhasil jika version belum berubah
  const updated = await tx.task.updateMany({
    where: { id, version: currentVersion },
    data: { status: nextStatus, version: { increment: 1 } }
  });
  if (updated.count === 0) throw new ConflictError("Task was modified by another user");
  ```
  Ini mengeliminasi bug *lost update* dan menjamin kronologi audit log 100% akurat.

#### 2. Mekanisme Identitas & Autentikasi (Prioritas #2)
- **Yang di-refactor:**
  Menghilangkan field `actor` dari payload request body. Memasang auth middleware yang mengekstrak identitas aktor dari JWT / Session terverifikasi (`req.user.id`).
- **Kenapa:**
  Audit log kehilangan nilai kepatuhan (*compliance*) jika siapa pun dapat mengaku sebagai aktor manapun.

#### 3. Pemisahan Event Audit Log (*Event-Driven Outbox Pattern*) (Prioritas #3)
- **Yang di-refactor:**
  Memisahkan mutasi task dari proses penulisan audit dan notifikasi menggunakan antrean pesan (*message broker* seperti Redis Streams / RabbitMQ / Kafka) atau transactional outbox pattern.
- **Kenapa:**
  Saat sistem membesar, perubahan status task sering memicu banyak aksi sampingan (notifikasi email, webhooks Slack, audit sink, metrik analytics). Mengalihkan audit logging ke event background menjaga waktu respon API tetap instan (<20ms).

---

### D. Jika kamu menggunakan AI, jelaskan bagian mana yang dibantu AI dan bagaimana kamu memvalidasinya.

#### Bagian yang Dibantu oleh AI:
1. **Scaffolding Struktur Kode & Boilerplate Layered Architecture**:
   Menyusun arsitektur berlapis pada backend (`controllers`, `services`, `repositories`, `validators`, `routes`, `middlewares`) dengan pengetikan TypeScript yang ketat.
2. **Penyusunan Skema OpenAPI 3.0 / Swagger UI**:
   Menghasilkan definisi OpenAPI spesifikasi lengkap untuk seluruh endpoint, parameter query, schema DTO, dan response envelope.
3. **Penyusunan Skenario Test Otomatis (`node:test`)**:
   Menuliskan 36 skenario integration test yang mencakup pengujian batas (*boundary conditions*), seperti:
   - Penolakan lompatan status non-adjacent (misal `todo` $\rightarrow$ `in_progress`).
   - Penolakan payload tanpa aktor.
   - Pengecekan idempotensi saat status yang diminta sama dengan status saat ini.
   - Pengecekan soft delete agar tidak bisa ditransisikan namun audit log-nya tetap bisa diakses.
4. **Integrasi Komponen UI HeroUI & Tailwind CSS**:
   Pembuatan komponen Kanban board frontend (`KanbanColumn`, `TaskCard`, `AuditTimeline` accordion dengan status badges, `AdvanceTaskModal`, `CreateTaskModal`).

#### Cara Memvalidasi Hasil AI:
1. **Eksekusi Otomatis Test Suite**:
   Menjalankan seluruh unit & integration test pada backend:
   ```bash
   npm test
   ```
   **Hasil:** Seluruh **36 test berhasil lolos (100% pass, 0 fail)** memvalidasi bahwa seluruh aturan domain terpenuhi secara presisi.
2. **Verifikasi Build & Type-Check Mandiri**:
   - Backend: `npm run build` (`tsc && tsc-alias`) berhasil mengompilasi seluruh modul TypeScript tanpa error tipe.
   - Frontend: `npm run build` (`tsc -b && vite build`) berhasil membundel aset web tanpa dependensi yang hilang.
3. **Verifikasi Standar Kode (Linting)**:
   Menjalankan `npm run lint` (`eslint .`) pada frontend dan memastikan **0 error & 0 warning**.
4. **Inspeksi Integritas Database Aktual**:
   Menjalankan kueri langsung terhadap SQLite engine (`dev.db`) menggunakan `better-sqlite3` dan Prisma Seeder untuk memverifikasi bahwa record tersimpan sesuai relasi foreign key dan timestamp chronologically ordered.
5. **Manual Code Review pada Bagian Kritis**:
   Memeriksa secara langsung logika `prisma.$transaction` untuk menjamin tidak ada celah di mana status task terupdate tanpa audit log, serta memastikan validasi `ALLOWED_STATUS_TRANSITIONS` menolak mutasi ilegal sebelum query database dijalankan.
