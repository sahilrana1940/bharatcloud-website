import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-lg font-semibold tracking-tight">BharatCloud</span>
          <Link
            href="/login"
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium hover:bg-sky-500"
          >
            Login
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-3xl font-bold">Your gallery</h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          B2C web is view-only. Upload photos and videos from the BharatCloud mobile app.
        </p>

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          <article className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <h2 className="font-medium">View</h2>
            <p className="mt-1 text-sm text-slate-400">Browse HOT and COLD items in your library.</p>
            <Link
              href="/gallery"
              className="mt-4 inline-block text-sm font-medium text-sky-400 hover:text-sky-300"
            >
              Open gallery →
            </Link>
          </article>

          <article className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <h2 className="font-medium">Download</h2>
            <p className="mt-1 text-sm text-slate-400">Save originals with a time-limited secure link.</p>
            <Link
              href="/gallery?action=download"
              className="mt-4 inline-block text-sm font-medium text-sky-400 hover:text-sky-300"
            >
              Download from gallery →
            </Link>
          </article>

          <article className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <h2 className="font-medium">QR Share</h2>
            <p className="mt-1 text-sm text-slate-400">Share read-only access via QR from your vault.</p>
            <Link
              href="/gallery?action=qr-share"
              className="mt-4 inline-block text-sm font-medium text-sky-400 hover:text-sky-300"
            >
              Share with QR →
            </Link>
          </article>
        </section>
      </main>
    </div>
  );
}
