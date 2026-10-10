"use client";

import {
  FileText,
  FolderOpen,
  Moon,
  Search,
  Share2,
  Sun,
  Trash2,
  Users,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";

import { DUMMY_FILES, type DummyFile } from "@/lib/b2b/dummy-files";
import { DUMMY_TEAM } from "@/lib/b2b/dummy-files";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { BrandMark } from "@/components/brand/BrandMark";
import { cn } from "@/lib/utils";

const nav = [
  { id: "files", label: "My Files", icon: FolderOpen },
  { id: "shared", label: "Shared with me", icon: Share2 },
  { id: "team", label: "Team", icon: Users },
  { id: "trash", label: "Trash", icon: Trash2 },
] as const;

const USED_GB = 40;
const LIMIT_GB = 100;

export function CloudDashboard() {
  const { theme, setTheme } = useTheme();
  const [section, setSection] = useState<(typeof nav)[number]["id"]>("files");
  const [query, setQuery] = useState("");
  const [files, setFiles] = useState(DUMMY_FILES);
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    file: DummyFile;
  } | null>(null);
  const [toast, setToast] = useState("");

  const filtered = files.filter((f) =>
    f.name.toLowerCase().includes(query.toLowerCase()),
  );

  const closeMenu = useCallback(() => setMenu(null), []);

  useEffect(() => {
    const onClick = () => closeMenu();
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [closeMenu]);

  function onContextMenu(e: React.MouseEvent, file: DummyFile) {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, file });
  }

  function action(label: string) {
    setToast(label);
    closeMenu();
    setTimeout(() => setToast(""), 2500);
  }

  const pct = Math.round((USED_GB / LIMIT_GB) * 100);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0c0d10] dark:text-slate-100">
      <aside className="hidden w-56 flex-shrink-0 border-r border-slate-200/80 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 md:flex md:flex-col">
        <div className="border-b border-slate-200/80 px-5 py-5 dark:border-slate-800">
          <BrandMark
            href="/"
            titleClass="text-slate-900 dark:text-slate-100"
            accentClass="text-sky-500"
          />
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                section === item.id
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-9"
                placeholder="Search files…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="min-w-[180px] flex-1 lg:max-w-xs">
                <div className="mb-1 flex justify-between text-xs text-slate-500">
                  <span>{USED_GB}GB / {LIMIT_GB}GB</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-lg border border-slate-200 p-2 dark:border-slate-700"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          {section === "team" ? (
            <TeamPanel />
          ) : section === "trash" ? (
            <EmptyState title="Trash is empty" />
          ) : section === "shared" ? (
            <EmptyState title="Nothing shared with you yet" />
          ) : (
            <>
              <h2 className="mb-4 text-sm font-medium text-slate-500">
                Recent files
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onContextMenu={(e) => onContextMenu(e, file)}
                  />
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      {menu && (
        <div
          className="fixed z-50 min-w-[160px] rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-xl dark:border-slate-700 dark:bg-slate-900"
          style={{ left: menu.x, top: menu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="block w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => action(`Share link copied — ${menu.file.name}`)}
          >
            Share
          </button>
          <button
            type="button"
            className="block w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => action(`Download started — ${menu.file.name}`)}
          >
            Download
          </button>
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
            onClick={() => {
              setFiles((prev) => prev.filter((f) => f.id !== menu.file.id));
              action(`Moved to trash — ${menu.file.name}`);
            }}
          >
            Delete
          </button>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">
          {toast}
        </div>
      )}
    </div>
  );
}

function FileCard({
  file,
  onContextMenu,
}: {
  file: DummyFile;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onContextMenu={onContextMenu}
      className="group cursor-default rounded-xl border border-slate-200/80 bg-white p-4 transition hover:border-sky-500/30 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-sky-500/40"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
          <FileText className="h-5 w-5 text-sky-600" />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-xs text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              ···
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Share</DropdownMenuItem>
            <DropdownMenuItem>Download</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="mt-3 truncate font-medium text-slate-900 dark:text-white">
        {file.name}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {file.sizeMb} MB · {file.owner} ·{" "}
        {new Date(file.updatedAt).toLocaleDateString()}
      </p>
    </div>
  );
}

function TeamPanel() {
  return (
    <div className="max-w-lg space-y-2">
      <h2 className="mb-4 text-sm font-medium text-slate-500">Team members</h2>
      {DUMMY_TEAM.map((m) => (
        <div
          key={m.email}
          className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900/80"
        >
          <div>
            <p className="font-medium">{m.name}</p>
            <p className="text-xs text-slate-500">{m.email}</p>
          </div>
          <span className="text-xs font-medium text-sky-600">{m.role}</span>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700">
      {title}
    </div>
  );
}
