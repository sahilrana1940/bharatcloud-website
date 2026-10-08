import Link from "next/link";

/** Legacy B2C gallery — not linked from main site */
export default function GalleryOldPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <p className="text-slate-400">Legacy B2C gallery (archived).</p>
      <Link href="/" className="mt-4 inline-block text-[#ff6a00]">
        Go to BharatCloud B2B →
      </Link>
    </div>
  );
}
