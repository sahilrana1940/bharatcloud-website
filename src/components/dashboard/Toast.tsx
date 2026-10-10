"use client";

export function Toast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-24 left-1/2 z-[70] max-w-[90vw] -translate-x-1/2 rounded-2xl bg-sky-600 px-5 py-2.5 text-center text-sm font-medium text-white shadow-xl md:bottom-6">
      {message}
    </div>
  );
}
