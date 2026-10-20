"use client";

import { useEffect } from "react";

/** If the stored role does not match this screen, open the other dashboard. */
export function RoleDashboardGate({ expect }: { expect: "admin" | "employee" }) {
  useEffect(() => {
    let cancelled = false;

    async function verify() {
      const stored = window.localStorage.getItem("user_role");
      const res = await fetch("/api/auth/role", { credentials: "include" });
      const body = await res.json().catch(() => ({}));
      if (cancelled) return;
      const role = String(body.role || stored || "");
      if (expect === "admin" && role === "employee") {
        window.location.href = "/dashboard/employee";
      }
      if (expect === "employee" && role === "admin") {
        window.location.href = "/dashboard/admin";
      }
    }

    verify().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [expect]);

  return null;
}
