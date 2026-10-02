# TUTOR-ME

TUTOR-ME is an exam preparation platform for Nigerian students, built with Next.js 16, React and Supabase Auth/PostgreSQL. The repository name remains `gradewise` for history; the visible product is TUTOR-ME.

## Local development

Use Node.js 22 or newer and install dependencies with `npm install`. Copy `.env.example` to `.env.local`, then configure a dedicated Supabase development project. Account access remains unavailable until valid Supabase public configuration is supplied.

```sh
npm run dev
```

Apply `supabase/migrations` using the Supabase CLI or your controlled migration workflow. Configure Upstash Redis before testing production-mode authentication rate limits.

## Commands

- `npm run dev` starts the Webpack development server.
- `npm run lint` runs ESLint.
- `TMPDIR=/tmp npm run build -- --webpack` builds for production with Webpack.
- `npm start` serves the production build locally.

The workspace includes local learning interactions that are not yet account-backed. See `docs/ARCHITECTURE.md` for implemented boundaries and launch integrations that remain. The scale goals are engineering targets; no capacity result is claimed.

Read `docs/SECURITY.md` and `docs/LOAD_TESTING.md` before configuring or measuring a production deployment.
