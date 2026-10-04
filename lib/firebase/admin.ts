import "server-only";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function adminApp() {
  const existing = getApps().find((app) => app.name === "tutor-me");
  if (existing) return existing;
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.GCLOUD_PROJECT ?? "tutor-me-2fb22";
  const email = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const credential = email && privateKey ? cert({ projectId, clientEmail: email, privateKey }) : applicationDefault();
  return initializeApp({ credential, projectId }, "tutor-me");
}

export function firebaseAdminAuth() { return getAuth(adminApp()); }
