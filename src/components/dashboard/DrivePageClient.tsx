"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DriveFile = {
  id: string;
  name: string;
  owner_email: string;
  size: number;
  publicLink: string | null;
  is_shortcut: boolean;
};

export function DrivePageClient({ isAdmin }: { isAdmin: boolean }) {
  const [tab, setTab] = useState<"google" | "safe">("safe");
  const [q, setQ] = useState("");
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [driveFull, setDriveFull] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch(
      `/api/drive/files?source=${tab === "google" ? "google" : "safe"}&q=${encodeURIComponent(q)}`,
    );
    const j = await res.json();
    setFiles(j.files || []);
  }, [tab, q]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/team/users")
      .then((r) => r.json())
      .then((j) => {
        const me = (j.users || []).find(
          (u: { email: string }) => u.email === j.session?.email,
        );
        if (me) {
          setDriveFull(me.drive_used_gb / me.drive_limit_gb > 0.9);
        }
      });
  }, []);

  async function copyLink(link: string | null) {
    if (!link) return;
    await navigator.clipboard.writeText(link);
  }

  async function moveShortcut(fileId: string) {
    await fetch("/api/drive/move-and-shortcut", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId }),
    });
    load();
  }

  async function bulkShortcuts() {
    for (const f of files) {
      if (!f.is_shortcut) await moveShortcut(f.id);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Drive</h1>
      {driveFull && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          Drive Full! 1 Click me khali karo — Shortcut banao
        </div>
      )}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className={`rounded-lg px-4 py-2 text-sm ${tab === "google" ? "bg-sky-600 text-white" : "bg-slate-200"}`}
          onClick={() => setTab("google")}
        >
          My Google Drive
        </button>
        <button
          type="button"
          className={`rounded-lg px-4 py-2 text-sm ${tab === "safe" ? "bg-sky-600 text-white" : "bg-slate-200"}`}
          onClick={() => setTab("safe")}
        >
          BharatCloud Safe Drive
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Input
          className="max-w-md"
          placeholder="Search name or owner"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {isAdmin && tab === "safe" && (
          <Button type="button" variant="outline" onClick={bulkShortcuts}>
            Move All & Create Shortcuts (Save 99% Space)
          </Button>
        )}
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {files.map((f) => (
          <div
            key={f.id}
            className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="font-medium truncate">{f.name}</p>
            <p className="mt-1 text-xs text-slate-500">
              {f.owner_email} · {(f.size / 1e6).toFixed(1)} MB
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => copyLink(f.publicLink)}
              >
                Copy BharatCloud Link
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => moveShortcut(f.id)}
                disabled={f.is_shortcut}
              >
                Move & Create Shortcut
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
