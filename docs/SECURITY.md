# Security model

## Secrets and environment

Only `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or Supabase publishable key), and the public site URL may be exposed to browser code. These public keys rely on RLS and are not secrets. Redis tokens, service-role keys and object-storage credentials are server-only. Do not set service-role credentials for normal user workflows. `.env.example` contains placeholders only; configure development, preview/staging and production separately in Vercel. Missing auth configuration disables account actions and readiness; it never falls back to fake auth.

## Sessions, CSRF and roles

Supabase SSR uses PKCE and HttpOnly secure cookies where HTTPS is active. `proxy.ts` refreshes only; protected pages/actions call `auth.getUser()` and RLS protects database rows. Next Server Actions validate request origin. Any future cookie-authenticated Route Handler mutation must check `Origin` against the configured site origin, reject oversized bodies, validate input and enforce authorization. Callback destinations are resolved and constrained to the request origin. Users cannot set their role through signup metadata, profile mutation, or client-selected IDs.

## Ownership isolation

Private records use `student_id = auth.uid()` policies, and foreign keys tie them to a student's profile. Never query private rows with a browser-supplied owner ID. Question and public pack access must be restricted to verified, rights-cleared, published records. Before production, create two test students in a disposable Supabase project and assert student A cannot select, insert, update or delete student B's profile, progress, attempts, mistakes, plans, notifications, CBT session or result. Also assert an authenticated student cannot change `profiles.role`. Those remote RLS tests have not been run in this workspace.

## Rate limits, inputs and logs

Signup, signin and password recovery use a shared Redis fixed-window limiter; production fails closed without Redis. The peer identity is sourced from the platform `x-real-ip` header, not caller-controlled `x-forwarded-for`. Add per-user and per-IP shared limits for search, AI, uploads and administrative APIs as those endpoints are created. Validate all inputs server-side with bounded lengths and enums. Validate file type, magic bytes, size and ownership before object upload. Never log passwords, tokens, email contents, student answers or private profiles. Return generic user-facing failures and retain internal request IDs for diagnosis.

## Headers and operations

The app sets `nosniff`, frame denial, strict referrer policy, a restrictive Permissions Policy and HSTS. A nonce-based CSP should be introduced after checking all app styles/scripts and the Supabase auth flow; no CSP is currently enforced. Privileged actions need append-only audit entries. `/api/health` and `/api/ready` expose only status and a boolean dependency state, not connection strings or stack traces. Rotate credentials after any suspected exposure and keep secrets out of git history.
