"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

import { getFirebasePublicConfig } from "@/lib/firebase-config";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

export function getFirebaseApp() {
  if (!app) {
    const config = getFirebasePublicConfig();
    app = getApps().length ? getApps()[0]! : initializeApp(config);
  }
  return app;
}

export function getFirebaseAuth() {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

export const googleProvider = new GoogleAuthProvider();
