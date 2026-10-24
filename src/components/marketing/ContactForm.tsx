"use client";

import { FormEvent, useState } from "react";

export function ContactForm() {
  const [sent, setSent] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "");
    const email = String(data.get("email") || "");
    const company = String(data.get("company") || "");
    const message = String(data.get("message") || "");
    const body = `Name: ${name}\nEmail: ${email}\nCompany: ${company}\n\n${message}`;
    window.location.href = `mailto:sales@bharatcloud.store?subject=${encodeURIComponent(
      "BharatCloud sales enquiry",
    )}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="relative rounded-[24px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8"
    >
      <div className="grid gap-4">
        <label className="text-sm text-gray-300">
          Name
          <input
            name="name"
            required
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-400"
          />
        </label>
        <label className="text-sm text-gray-300">
          Email
          <input
            name="email"
            type="email"
            required
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-400"
          />
        </label>
        <label className="text-sm text-gray-300">
          Company
          <input
            name="company"
            required
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-400"
          />
        </label>
        <label className="text-sm text-gray-300">
          Message
          <textarea
            name="message"
            required
            rows={5}
            className="mt-1.5 w-full resize-y rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-400"
          />
        </label>
        <button
          type="submit"
          className="h-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 font-bold text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50"
        >
          Send message
        </button>
        {sent ? <p className="text-sm text-orange-200">Your email app should open with this message to sales.</p> : null}
      </div>
    </form>
  );
}
