import Link from "next/link";

const actions = ["view", "download", "qr-share"] as const;

type Props = {
  searchParams: Promise<{ action?: string }>;
};

export default async function GalleryPage({ searchParams }: Props) {
  const { action } = await searchParams;
  const mode: (typeof actions)[number] =
    action && actions.includes(action as (typeof actions)[number])
      ? (action as (typeof actions)[number])
      : "view";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-200">
            ← Home
          </Link>
          <span className="font-medium capitalize">{mode.replace("-", " ")}</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-slate-400">
          Gallery placeholder — connect to backend presigned URLs. No upload on web.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/gallery"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-900"
          >
            View
          </Link>
          <Link
            href="/gallery?action=download"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-900"
          >
            Download
          </Link>
          <Link
            href="/gallery?action=qr-share"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-900"
          >
            QR Share
          </Link>
        </div>
      </main>
    </div>
  );
}
