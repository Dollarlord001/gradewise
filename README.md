# TUTOR-ME

TUTOR-ME is an exam preparation platform for Nigerian students, built with Next.js 16, React, Firebase Authentication and Supabase PostgreSQL. The repository name remains `gradewise` for history; the visible product is TUTOR-ME.

## Local development

Use Node.js 22 or newer and install dependencies with `npm install`. Copy `.env.example` to `.env.local`, configure Supabase and Firebase web values, and provide Firebase Admin service-account environment variables or Application Default Credentials. Account access remains unavailable until Firebase Admin verifies tokens and the Firebase identity migration is applied.

```sh
npm run dev
```

Apply `supabase/migrations` using the Supabase CLI or your controlled migration workflow. Enable Supabase's Firebase third-party Auth integration for project `tutor-me-2fb22` so PostgreSQL RLS receives verified Firebase JWT claims. Configure Upstash Redis before testing production-mode authentication rate limits.

## Commands

- `npm run dev` starts the Webpack development server.
- `npm run lint` runs ESLint.
- `TMPDIR=/tmp npm run build -- --webpack` builds for production with Webpack.
- `npm start` serves the production build locally.

The workspace includes local learning interactions that are not yet account-backed. See `docs/ARCHITECTURE.md` for implemented boundaries and launch integrations that remain. The scale goals are engineering targets; no capacity result is claimed.

Read `docs/SECURITY.md` and `docs/LOAD_TESTING.md` before configuring or measuring a production deployment.
