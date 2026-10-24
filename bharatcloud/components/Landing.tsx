"use client";

import { signInWithPopup } from "firebase/auth";

import { getFirebaseAuth, googleProvider } from "@/lib/firebase-client";

export function Landing({ onSignedIn }: { onSignedIn: () => void }) {
  async function signInWithGoogle() {
    await signInWithPopup(getFirebaseAuth(), googleProvider);
    onSignedIn();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#0c4a6e] to-[#0369a1] text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-300">Made for Bharat</p>
        <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-6xl">
          BharatCloud
          <span className="block text-2xl font-medium text-sky-200 sm:text-3xl">
            Secure Cloud Backup for Indian Companies
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-sky-100/90">
          Your files on Indian-region object storage. Encrypted in transit. Built for teams who want data sovereignty
          without enterprise complexity.
        </p>

        <ul className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { title: "Secure", desc: "Firebase Google sign-in · server-side uploads only" },
            { title: "Indian servers", desc: "IDrive E2 ap-south-1 (Mumbai region)" },
            { title: "10 GB free", desc: "Start backing up work files today" },
          ].map((f) => (
            <li key={f.title} className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="text-lg font-semibold text-orange-300">{f.title}</p>
              <p className="mt-2 text-sm text-sky-100/80">{f.desc}</p>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => signInWithGoogle().catch(console.error)}
          className="mt-12 inline-flex w-fit items-center gap-3 rounded-full bg-white px-8 py-4 text-base font-bold text-slate-900 shadow-xl transition hover:bg-orange-50"
        >
          <GoogleIcon />
          Continue with Google
        </button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.083 36 24 36c-5.514 0-10-4.486-10-10s4.486-10 10-10c2.569 0 4.914.975 6.674 2.573l6.059-6.059C33.808 10.129 29.142 8 24 8 12.954 8 4 16.954 4 28s8.954 20 20 20 20-8.954 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 13 24 13c2.569 0 4.914.975 6.674 2.573l6.059-6.059C33.808 10.129 29.142 8 24 8 16.318 8 9.656 13.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 48c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.091 39.091 26.715 40 24 40c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 43.556 16.227 48 24 48z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.05 12.05 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}
