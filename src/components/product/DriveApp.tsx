"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { bytesLabel } from "@/lib/product/money";

type FileRow = {
  id: string;
  name: string;
  kind: "file" | "folder";
  size_bytes: number;
  parent_id: string | null;
  starred: boolean;
  updated_at: string;
};

type Person = { id: string; name: string; email: string; role: string };
type ShareRow = {
  id: string;
  shared_with: string | null;
  permission: string;
  link_enabled: boolean;
  link_token: string | null;
  created_at: string;
  person: { name: string; email: string } | null;
};

const FILTERS = [
  { id: "folder", label: "My Drive" },
  { id: "recent", label: "Recent" },
  { id: "starred", label: "Starred" },
  { id: "shared", label: "Shared With Me" },
  { id: "trash", label: "Trash" },
];

export function DriveApp() {
  const params = useSearchParams();
  const initial = params.get("filter") || "folder";
  const [filter, setFilter] = useState(initial);
  const [folder, setFolder] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");
  const [files, setFiles] = useState<FileRow[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [crumb, setCrumb] = useState<{ id: string | null; name: string }[]>([]);
  const [usage, setUsage] = useState({ usedBytes: 0, limitBytes: 1 });
  const [access, setAccess] = useState("demo");
  const [error, setError] = useState("");
  const [menu, setMenu] = useState<FileRow | null>(null);
  const [shareFor, setShareFor] = useState<FileRow | null>(null);

  async function load(nextFilter = filter, nextFolder = folder, nextQuery = query) {
    const search = new URLSearchParams({ filter: nextFilter, q: nextQuery });
    if (nextFolder) search.set("folder", nextFolder);
    const response = await fetch(`/api/product/drive?${search.toString()}`);
    const body = await response.json();
    if (!response.ok) {
      setError(body.error || "Drive nahi khula.");
      return;
    }
    setError("");
    setFiles(body.files || []);
    setPeople(body.people || []);
    setCrumb(body.breadcrumb || []);
    setUsage(body.usage);
    setAccess(body.access);
  }

  useEffect(() => {
    const timer = setTimeout(() => void load(initial, null, ""), 0);
    return () => clearTimeout(timer);
    // initial filter from the URL is the first view
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  async function post(payload: object) {
    const response = await fetch("/api/product/drive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json();
    if (!response.ok) setError(body.error || "Action fail.");
    else await load();
  }

  async function makeFolder() {
    const name = window.prompt("Folder ka naam");
    if (!name) return;
    await post({ action: "folder", name, parentId: filter === "folder" ? folder : null });
  }

  async function upload(file: File) {
    const form = new FormData();
    form.set("file", file);
    if (folder && filter === "folder") form.set("parentId", folder);
    const response = await fetch("/api/product/drive", { method: "POST", body: form });
    const body = await response.json();
    if (!response.ok) setError(body.error || "Upload fail.");
    else await load();
  }

  async function download(id: string) {
    const response = await fetch(`/api/product/drive?download=${id}`);
    const body = await response.json();
    if (!response.ok) {
      setError(body.error || "Download nahi hua.");
      return;
    }
    window.open(body.url, "_blank", "noopener,noreferrer");
  }

  const percent = Math.min(100, Math.round((usage.usedBytes / Math.max(usage.limitBytes, 1)) * 100));

  return (
    <div className="flex min-h-screen bg-white text-[#1c1915]">
      <aside className="hidden w-56 shrink-0 border-r bg-[#fafafa] p-4 md:block">
        <Link href="/hub" className="text-sm font-bold">Bharat Tijori</Link>
        <nav className="mt-6 space-y-1 text-sm">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setFilter(item.id);
                setFolder(null);
                void load(item.id, null, query);
              }}
              className={`block w-full rounded-xl px-3 py-2 text-left ${filter === item.id ? "bg-[#e8f3ef] font-semibold" : ""}`}
            >
              {item.label}
            </button>
          ))}
          <Link href="/hub/backup" className="block rounded-xl px-3 py-2">Email Backup</Link>
        </nav>
      </aside>
      <section className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                setFilter("search");
                void load("search", null, query);
              }
            }}
            placeholder="Search karo"
            className="min-w-40 flex-1 rounded-full border px-4 py-2 text-sm"
          />
          <button onClick={makeFolder} className="rounded-full border px-3 py-2 text-sm">Folder Banao</button>
          <label className="rounded-full bg-[#1c1915] px-3 py-2 text-sm text-white">
            Upload
            <input type="file" className="hidden" onChange={(event) => event.target.files?.[0] && upload(event.target.files[0])} />
          </label>
          <button onClick={() => setView(view === "list" ? "grid" : "list")} className="rounded-full border px-3 py-2 text-sm">
            {view === "list" ? "Grid" : "List"}
          </button>
        </header>
        <div className="px-4 py-3">
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-[#f1f1f1]">
            <div className="h-full bg-[#0f6b4c]" style={{ width: `${percent}%` }} />
          </div>
          <p className="text-xs text-[#666]">{bytesLabel(usage.usedBytes)} use hua · {bytesLabel(Math.max(0, usage.limitBytes - usage.usedBytes))} bacha · {access}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {crumb.map((item) => (
              <button key={item.name} onClick={() => { setFilter("folder"); setFolder(item.id); void load("folder", item.id, ""); }} className="text-[#0f6b4c]">
                {item.name} /
              </button>
            ))}
          </div>
          {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
          {files.length === 0 ? <p className="mt-8 text-sm text-[#666]">Yahan abhi kuch nahi hai.</p> : null}
          <div className={view === "grid" ? "mt-4 grid gap-3 sm:grid-cols-3" : "mt-4 divide-y"}>
            {files.map((file) => (
              <article
                key={file.id}
                className="flex items-center justify-between gap-3 py-3 text-sm"
                onContextMenu={(event) => {
                  event.preventDefault();
                  setMenu(file);
                }}
              >
                <button
                  className="min-w-0 flex-1 truncate text-left font-medium"
                  onClick={() => {
                    if (file.kind === "folder" && filter !== "trash") {
                      setFilter("folder");
                      setFolder(file.id);
                      void load("folder", file.id, "");
                    } else void post({ action: "open", fileId: file.id });
                  }}
                >
                  {file.kind === "folder" ? "Folder" : "File"} · {file.name}
                </button>
                <span className="text-xs text-[#777]">{file.kind === "file" ? bytesLabel(file.size_bytes) : ""}</span>
                <button onClick={() => setMenu(file)} className="px-2">⋯</button>
              </article>
            ))}
          </div>
        </div>
      </section>
      {menu ? (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/20 md:items-center" onClick={() => setMenu(null)}>
          <div className="w-full max-w-xs rounded-2xl bg-white p-3 text-sm shadow-lg" onClick={(event) => event.stopPropagation()}>
            <p className="px-2 py-1 font-semibold">{menu.name}</p>
            <MenuButton label="Share" onClick={() => { setShareFor(menu); setMenu(null); }} />
            <MenuButton label="Star" onClick={() => { void post({ action: "star", fileId: menu.id }); setMenu(null); }} />
            {menu.kind === "file" ? <MenuButton label="Download" onClick={() => { void download(menu.id); setMenu(null); }} /> : null}
            {filter === "trash" ? (
              <MenuButton label="Restore" onClick={() => { void post({ action: "restore", fileId: menu.id }); setMenu(null); }} />
            ) : (
              <MenuButton label="Trash" onClick={() => { void post({ action: "trash", fileId: menu.id }); setMenu(null); }} />
            )}
          </div>
        </div>
      ) : null}
      {shareFor ? <ShareDialog file={shareFor} people={people} onClose={() => setShareFor(null)} /> : null}
    </div>
  );
}

function MenuButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button onClick={onClick} className="block w-full rounded-xl px-2 py-2 text-left hover:bg-[#f6f3ec]">{label}</button>;
}

function ShareDialog({ file, people, onClose }: { file: FileRow; people: Person[]; onClose: () => void }) {
  const [board, setBoard] = useState<{ shares: ShareRow[]; activity: { id: string; action: string; actor: string; created_at: string }[]; comments: { id: string; body: string; author: string }[] } | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [permission, setPermission] = useState("view");
  const [linkOn, setLinkOn] = useState(false);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");

  async function load() {
    const response = await fetch(`/api/product/share?fileId=${file.id}`);
    const body = await response.json();
    if (!response.ok) setError(body.error || "Share nahi khula.");
    else {
      setBoard(body);
      const link = (body.shares || []).find((share: ShareRow) => !share.shared_with);
      setLinkOn(Boolean(link?.link_enabled));
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file.id]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/product/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId: file.id, userIds: picked, permission, linkEnabled: linkOn }),
    });
    const body = await response.json();
    if (!response.ok) setError(body.error || "Share nahi hua.");
    else {
      setBoard(body);
      setPicked([]);
    }
  }

  async function update(payload: object) {
    const response = await fetch("/api/product/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", fileId: file.id, ...payload }),
    });
    const body = await response.json();
    if (!response.ok) setError(body.error || "Update nahi hua.");
    else setBoard(body);
  }

  const link = board?.shares.find((share) => !share.shared_with);
  const linkUrl = link?.link_token ? `${window.location.origin}/hub/link/${link.link_token}` : "";

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/30 md:items-center" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-t-3xl bg-white p-5 md:rounded-3xl" onClick={(event) => event.stopPropagation()}>
        <h2 className="text-lg font-bold">Share · {file.name}</h2>
        <form onSubmit={save} className="mt-3 space-y-2 text-sm">
          <p className="font-semibold">Employee search</p>
          <div className="max-h-32 space-y-1 overflow-auto">
            {people.filter((person) => person.role !== "partner").map((person) => (
              <label key={person.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={picked.includes(person.id)}
                  onChange={(event) => setPicked(event.target.checked ? [...picked, person.id] : picked.filter((id) => id !== person.id))}
                />
                {person.name} · {person.email}
              </label>
            ))}
          </div>
          <select value={permission} onChange={(event) => setPermission(event.target.value)} className="w-full rounded-xl border px-3 py-2">
            <option value="view">View Only</option>
            <option value="comment">Can Comment</option>
            <option value="edit">Can Edit</option>
            <option value="download">Can Download</option>
          </select>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={linkOn} onChange={(event) => setLinkOn(event.target.checked)} />
            Link {linkOn ? "On" : "Off"}
          </label>
          <button className="rounded-full bg-[#1c1915] px-4 py-2 font-semibold text-white">Share karo</button>
        </form>
        {linkUrl && link?.link_enabled ? (
          <button
            className="mt-3 text-sm font-semibold text-[#0f6b4c]"
            onClick={() => navigator.clipboard.writeText(linkUrl)}
          >
            Link copy karo
          </button>
        ) : null}
        {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Manage Share</h3>
            <button onClick={() => update({ removeAll: true })} className="text-red-700">Remove All Share</button>
          </div>
          {(board?.shares || []).filter((share) => share.shared_with).map((share) => (
            <div key={share.id} className="rounded-xl border p-2">
              <p>{share.person?.name || "User"} · {share.permission} · {new Date(share.created_at).toLocaleString("en-IN")}</p>
              <div className="mt-1 flex gap-2">
                <select defaultValue={share.permission} onChange={(event) => update({ shareId: share.id, permission: event.target.value })} className="rounded border px-2 py-1">
                  <option value="view">View</option>
                  <option value="comment">Comment</option>
                  <option value="edit">Edit</option>
                  <option value="download">Download</option>
                </select>
                <button onClick={() => update({ shareId: share.id, remove: true })}>Remove</button>
              </div>
            </div>
          ))}
          <h3 className="pt-2 font-semibold">Share Activity</h3>
          {(board?.activity || []).map((row) => (
            <p key={row.id}>{row.actor} ne {row.action} kiya · {new Date(row.created_at).toLocaleString("en-IN")}</p>
          ))}
          <h3 className="pt-2 font-semibold">Comments</h3>
          {(board?.comments || []).map((row) => <p key={row.id}>{row.author}: {row.body}</p>)}
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const response = await fetch("/api/product/share", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "comment", fileId: file.id, body: comment }),
              });
              const body = await response.json();
              if (!response.ok) setError(body.error || "Comment nahi gaya.");
              else {
                setBoard(body);
                setComment("");
              }
            }}
            className="flex gap-2"
          >
            <input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Comment" className="flex-1 rounded-xl border px-3 py-2" />
            <button className="rounded-full border px-3">Bhejo</button>
          </form>
        </div>
      </div>
    </div>
  );
}
