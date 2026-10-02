# TUTOR-ME architecture

## Current foundation and scale target

TUTOR-ME is a stateless Next.js App Router application intended for Cloudflare edge delivery and Vercel compute. Supabase Auth issues PKCE sessions, PostgreSQL is the structured system of record, and RLS is the final ownership boundary. **Architected and load-test-ready for 1,000,000+ registered users and 200,000+ concurrent active users.** This is an engineering target and has not been capacity-tested.

```text
Cloudflare edge/CDN → Vercel Next.js instances → Supabase Auth
                                          └── pooled PostgreSQL (RLS, migrations)
                                               ├── disposable shared cache
                                               ├── managed durable job provider
                                               └── object storage + CDN
```

Next.js instances do not own durable state. No application data is written to local files or process memory. PostgreSQL remains authoritative if cache is unavailable. Private authenticated responses must not be put in a shared cache. Large downloads, video, images and CBT packages belong in object storage, served through short-lived signed URLs. The `lib/architecture` modules define replaceable cache, jobs, storage, and AI boundaries; their unconfigured adapters fail explicitly.

## Authentication and authorization

`@supabase/ssr` stores Supabase PKCE session state in secure cookies. `proxy.ts` refreshes sessions using `auth.getUser()`, which validates against Supabase Auth; it does not make authorization decisions. Protected server pages and every private server action/handler must authenticate independently. Supabase cookies contain only session material, never student profiles or learning history. Signup requires email verification when enabled in Supabase. Recovery uses a one-time link and authenticated password update. Signup, signin and recovery are rate-limited through shared Upstash Redis in production and fail closed if that provider is missing or unavailable. Server Actions also use Next's origin checks; public mutation handlers must add explicit same-origin/CSRF validation.

The migration creates a student profile on auth signup and assigns `student` in the database. Browser supplied user IDs and role claims are never used to select a student's data. `save_student_onboarding` derives the owner from `auth.uid()` and updates name, exam, target, rhythm, preferences and subjects atomically. Staff roles require a trusted administrative workflow; no client update permission exists for `profiles.role`.

## PostgreSQL, RLS and connection pooling

Apply versioned SQL through Supabase migrations. UUIDs, foreign keys, check constraints, idempotency uniqueness and indexes are defined for the current foundation: profile/onboarding, subjects, goals/plans, topics/mastery, question records/attempts, mistakes, notifications and CBT packs/sessions/results. Exact past-question lookup uses `(exam, year, subject, question_number)` and the unique paper-aware index. Student history uses `(student_id, created_at DESC, id)` style indexes and must stay paginated/bounded.

Use Supabase's pooled connection endpoint (transaction pooling for serverless workloads) for any direct PostgreSQL client added later. This repository currently uses Supabase's HTTP/PostgREST client and opens no per-user PostgreSQL socket. RLS is enabled on private tables. Each policy scopes records to `auth.uid()`; public question and pack metadata is limited to verified/licensed or published rows. A production deployment must run the migration and ownership tests against a disposable Supabase project before launch.

## Student data and background work

Authenticated onboarding now writes durably in one transaction. Existing learning workspace interactions are still client-side sample implementations and are not yet a persistent student-record system; connect each mutation to a separately authorized, idempotent server action before describing it as saved account progress. Persist meaningful attempts, mistake state, goals and plans; do not persist animation frames or transient selections. Queue mastery aggregation, recommendations, notifications, CBT pack generation, indexing and reports in a managed retryable job system with idempotency keys. Do not run permanent workers inside Vercel functions.

## Offline CBT

The `lib/cbt/offline.ts` contract stores packs and attempts in IndexedDB. A pack is versioned and includes exam/year/subject/paper, questions, options, correct answers, explanations, topics, scoring and instructions. Install verifies the canonical JSON SHA-256 and schema version. New releases use a new immutable version. An attempt stores a stable ID, pack version, start timestamp, duration, answer map, review marks and status; remaining time derives from timestamps, not a background timer. Answer changes stay local. Scoring can run offline. Sync must be batched, authenticated and idempotent; retries use the same attempt ID. The current UI has not yet been wired to this pack engine or a pack download API, so the CBT feature is not yet end-to-end offline CBT.

Pack JSON and media should be published to object storage/CDN; PostgreSQL stores metadata, versions, hashes and byte sizes. Results and session metadata stay in PostgreSQL. Never trust a client-reported score during synchronization: verify against the immutable pack version. A server-side verifier and the authenticated sync endpoint remain launch requirements.

## Cache, storage and failure isolation

Cache only public exam/syllabus metadata, public content and non-sensitive configuration. The cache adapter is disposable and currently a no-op; PostgreSQL is the fallback authority. Avoid globally caching any authenticated response. Object storage has a signed URL interface and must be configured before uploads or private resources are exposed. AI, notifications, cache and analytics errors should not break ordinary study routes. Offline CBT does not require sync availability.

## AI and editorial boundaries

`lib/architecture/ai.ts` defines provider-neutral seams for `AIProvider`, `QuestionResolver`, `EducationalRetriever`, `VisionSolver`, `ExplanationGenerator` and `TutorContextBuilder`. No complete AI engine or AI endpoint is implemented. Exact retrieved questions must be labelled separately from related and generated questions, with provenance retained. Add quotas, rate limits, streaming, provider fallback and redacted observability when an AI provider is selected.

Published education reporting should use an editorial workflow (`draft → pending_review → published → corrected → archived`) and preserve sources, rights, verification, editor and correction history in internal records. The current resource pages are not backed by an editorial CMS/workflow.

## Observability and delivery

`/api/health` is a lightweight process response; `/api/ready` checks required Supabase configuration and a bounded database request. Both are no-store and return no secrets. Proxy assigns/propagates a request ID. Add a managed error collector, structured server logs and managed cache/job health checks before launch. Vercel deployment must set environment values independently for development, preview and production. See [SECURITY.md](SECURITY.md) and [LOAD_TESTING.md](LOAD_TESTING.md).
