#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail

ROOT="${TUTOR_ME_ROOT:-$HOME/gradewise}"
SCRIPT="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
if [[ "${TUTOR_ME_ENV_LOADED:-}" != 1 ]]; then
  cd "$ROOT"
  exec node -e 'const {loadEnvConfig}=require("@next/env");loadEnvConfig(process.cwd());const {spawnSync}=require("node:child_process");const r=spawnSync("bash",[process.argv[1]],{stdio:"inherit",env:{...process.env,TUTOR_ME_ENV_LOADED:"1"}});process.exit(r.status??1)' "$SCRIPT"
fi

cd "$ROOT"
LOG="$HOME/tutorme-full-production.log"
BASE="${TUTOR_ME_BASE_URL:-http://127.0.0.1:3000}"
PASS=0; FAIL=0
pass(){ printf 'PASS  %s\n' "$1"; PASS=$((PASS+1)); }
fail(){ printf 'FAIL  %s\n' "$1"; FAIL=$((FAIL+1)); }
http_check(){ local name="$1" path="$2" expected="$3" got; got="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "$BASE$path" 2>/dev/null || true)"; [[ "$got" == "$expected" ]] && pass "$name [$got]" || fail "$name expected $expected, got ${got:-000}"; }

for file in package.json app/api/auth/session/route.ts lib/firebase/admin.ts lib/firebase/session.ts lib/supabase/server.ts app/api/cbt/me/route.ts app/api/cbt/progress/route.ts app/api/cbt/questions/route.ts proxy.ts; do
  [[ -f "$file" ]] && pass "Exists: $file" || fail "Missing: $file"
done
for key in NEXT_PUBLIC_FIREBASE_API_KEY FIREBASE_ADMIN_CLIENT_EMAIL FIREBASE_ADMIN_PRIVATE_KEY NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY; do
  [[ -n "${!key:-}" ]] && pass "$key configured" || fail "$key missing"
done
[[ -n "${FIREBASE_ADMIN_PROJECT_ID:-${FIREBASE_PROJECT_ID:-${NEXT_PUBLIC_FIREBASE_PROJECT_ID:-}}}" ]] && pass "Firebase project configured" || fail "Firebase project missing"

npx tsc --noEmit && pass "TypeScript" || fail "TypeScript"
npm run lint && pass "ESLint" || fail "ESLint"
TMPDIR="$HOME" npm run build -- --webpack && pass "Production build" || { fail "Production build"; exit 1; }

npm start >"$LOG" 2>&1 & SERVER_PID=$!
cleanup_server(){ kill "$SERVER_PID" 2>/dev/null || true; wait "$SERVER_PID" 2>/dev/null || true; }
trap cleanup_server EXIT
ready=0
for _ in $(seq 1 40); do if curl -fsS --max-time 2 "$BASE/api/health" >/dev/null 2>&1; then ready=1; break; fi; sleep 1; done
if [[ "$ready" == 1 ]]; then pass "Production server started"; else fail "Production server did not start"; cat "$LOG"; exit 1; fi

for route in / /exams /jamb /waec /neco /bece /learn /practice /ai-tutor /ai-class /voice-tutor /snap-question /planner /progress /review /weak-areas /diagnosis /challenges /leaderboard /learn/videos /learn/notes /learn/flashcards /learn/resources; do http_check "Public route $route" "$route" 200; done
http_check "Health" /api/health 200
http_check "Readiness" /api/ready 200
http_check "Unauthenticated CBT page protection" /cbt 307
http_check "Unauthenticated identity protection" /api/cbt/me 401
http_check "Unauthenticated progress protection" /api/cbt/progress 401
http_check "Unauthenticated question bank protection" '/api/cbt/questions?subject=Biology&count=1' 401
http_check "Unauthenticated mistake-bank protection" /mistake-bank 307

node --input-type=module <<'NODE'
import crypto from "node:crypto";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { createClient } from "@supabase/supabase-js";

const env = (...names) => names.map((name) => process.env[name]).find(Boolean);
const projectId = env("FIREBASE_ADMIN_PROJECT_ID", "FIREBASE_PROJECT_ID", "NEXT_PUBLIC_FIREBASE_PROJECT_ID");
const clientEmail = env("FIREBASE_ADMIN_CLIENT_EMAIL");
const privateKey = env("FIREBASE_ADMIN_PRIVATE_KEY")?.replace(/\\n/g, "\n");
const apiKey = env("NEXT_PUBLIC_FIREBASE_API_KEY", "FIREBASE_API_KEY");
const base = env("TUTOR_ME_BASE_URL") ?? "http://127.0.0.1:3000";
if (!projectId || !clientEmail || !privateKey || !apiKey) throw new Error("Firebase smoke configuration incomplete");
if (!getApps().length) initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) }, "tutorme-smoke");
const auth = getAuth(getApps().find((app) => app.name === "tutorme-smoke"));
const suffix = `${Date.now().toString(36)}${crypto.randomBytes(5).toString("hex")}`;
const password = `Tm-${crypto.randomBytes(20).toString("hex")}a9!`;
const check = (name, ok, detail = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` (${detail})` : ""}`); if (!ok) process.exitCode = 1; };
let user;
try {
  user = await auth.createUser({ email: `tutorme-smoke-${suffix}@example.com`, password, emailVerified: true, displayName: "TUTOR-ME Smoke Account" });
  check("Temporary Firebase user created", true);
  const signInResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: user.email, password, returnSecureToken: true }) });
  check("Firebase sign-in", signInResponse.ok);
  if (!signInResponse.ok) throw new Error("Firebase sign-in failed");
  const signIn = await signInResponse.json();
  check("Firebase ID token", typeof signIn.idToken === "string");
  let idToken = signIn.idToken;
  let refreshToken = signIn.refreshToken;
  let session;
  for (let attempt = 0; attempt < 3; attempt++) {
    session = await fetch(`${base}/api/auth/session`, { method: "POST", headers: { "content-type": "application/json", origin: base }, body: JSON.stringify({ idToken }) });
    if (!session.ok) break;
    const body = await session.json();
    if (!body.refreshToken) break;
    const refreshedResponse = await fetch(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(apiKey)}`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }) });
    if (!refreshedResponse.ok) throw new Error("Firebase token refresh failed");
    const refreshed = await refreshedResponse.json();
    idToken = refreshed.id_token;
    refreshToken = refreshed.refresh_token;
  }
  const setCookie = session?.headers.getSetCookie?.().join(";") ?? session?.headers.get("set-cookie") ?? "";
  check("Firebase session cookie", Boolean(session?.ok && setCookie.includes("tutorme_session")));
  if (!session.ok) throw new Error(`Firebase session creation failed: ${await session.text()}`);
  const cookie = (session.headers.getSetCookie?.()[0] ?? session.headers.get("set-cookie"))?.split(";")[0];
  const request = async (path) => fetch(`${base}${path}`, { headers: { cookie } });
  const [me, progress, questions] = await Promise.all([
    request("/api/cbt/me"), request("/api/cbt/progress"), request("/api/cbt/questions?subject=Biology&count=1"),
  ]);
  check("Authenticated /api/cbt/me and student identity", me.status === 200, String(me.status));
  check("Authenticated /api/cbt/progress", progress.status === 200, String(progress.status));
  check("Authenticated verified question bank", questions.status === 200, String(questions.status));
  const supabase = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("NEXT_PUBLIC_SUPABASE_ANON_KEY"), { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, global: { headers: { Authorization: `Bearer ${idToken}` } } });
  const identity = await supabase.rpc("current_student_id");
  check("Supabase Firebase RLS identity function", !identity.error && typeof identity.data === "string");
} finally {
  if (user) await auth.deleteUser(user.uid).then(() => console.log("PASS  Temporary Firebase user deleted")).catch(() => console.error("FAIL  Temporary Firebase user cleanup failed"));
}
NODE

printf '\nPASS: %s\nFAIL: %s\n' "$PASS" "$FAIL"
[[ "$FAIL" == 0 ]]
