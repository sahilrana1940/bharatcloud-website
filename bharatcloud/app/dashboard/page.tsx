"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";

import { Dashboard } from "@/components/Dashboard";
import { Landing } from "@/components/Landing";
import { getFirebaseAuth } from "@/lib/firebase-client";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(getFirebaseAuth(), (u) => {
      setUser(u);
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-slate-900">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Landing onSignedIn={() => setUser(getFirebaseAuth().currentUser)} />;
  }

  return <Dashboard user={user} />;
}
