"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

export function firebaseAuth() {
  if (!config.apiKey || !config.authDomain || config.projectId !== "tutor-me-2fb22" || !config.appId) {
    throw new Error("Firebase web configuration is incomplete or does not match the TUTOR-ME project.");
  }
  const app = getApps().length ? getApp() : initializeApp(config);
  return getAuth(app);
}
