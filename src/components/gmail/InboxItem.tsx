export type InboxItemProps = {
  subject?: string | null;
  snippet?: string | null;
  from_email?: string | null;
  created_at?: string | null;
  isSuperAdmin?: boolean;
  view_count?: number;
  saved_mb?: number;
};

export function InboxItem({
  subject,
  snippet,
  from_email,
  created_at,
  isSuperAdmin = false,
  view_count = 0,
  saved_mb = 0,
}: InboxItemProps) {
  const when = created_at ? new Date(created_at).toLocaleString() : "";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="font-bold text-slate-900">{subject || "(no subject)"}</h3>
      {snippet ? <p className="mt-1 line-clamp-2 text-sm text-slate-600">{snippet}</p> : null}
      <p className="mt-2 text-xs text-slate-500">
        {from_email || "Unknown sender"}
        {when ? ` · ${when}` : ""}
      </p>
      {isSuperAdmin ? (
        <p className="mt-2 text-xs font-medium text-red-600">
          TEAM VIEW: {view_count} users • Stored 1x • Saved {saved_mb}MB
        </p>
      ) : null}
    </article>
  );
}
