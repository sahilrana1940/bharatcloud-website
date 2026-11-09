import Link from "next/link";

const FEATURES = [
  { title: "Bharat Tijori Drive", body: "Folder, upload, download, search, star, trash. Company ke andar Google Drive jaisa kaam." },
  { title: "Email Backup", body: "Admin aur employee apna email backup Tijori me rakhte hain. Backup delete nahi hota." },
  { title: "ID aur Storage", body: "Partner company ko ID aur GB baantta hai. Company admin employee ko apne quota se deta hai." },
  { title: "Share, poora control", body: "View, comment, edit, download. Link on ya off. Sirf company ke logon ke saath." },
];

const STEPS = [
  { n: "1", title: "Partner register", body: "Naam, mobile, WhatsApp, state aur city. Jaise Jammu, Delhi, Mumbai." },
  { n: "2", title: "Super Admin approve", body: "Ek click me approve ya reject. WhatsApp se partner ko khabar jaati hai." },
  { n: "3", title: "Starter plan", body: "₹6,999 / Year. 5 ID aur 100 GB. Company ka price yahan nahi dikhta." },
  { n: "4", title: "Company aur team", body: "Partner company banata hai, price set karta hai, ID aur storage baantta hai." },
];

const FAQS = [
  { q: "Company ko partner ka kharid bhaav dikhega?", a: "Nahi. Partner ka ₹6,999 company admin ko nahi dikhta. Unhe wahi price dikhega jo partner ne unke liye set kiya." },
  { q: "Payment kahan jaata hai?", a: "UPI se seedha Super Admin ko. Partner ki commission alag se calculate hoti hai." },
  { q: "Demo kitne din ka hai?", a: "Company ko 7 din full access milta hai. Uske baad plan pay karke aage badhte hain." },
  { q: "Partner files dekh sakta hai?", a: "Nahi. Na partner, na Super Admin. Drive aur Email Backup sirf company admin aur employee ke liye hai." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f6f3ec] text-[#1c1915]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div>
          <p className="text-lg font-bold tracking-tight">BharatCloud</p>
          <p className="text-xs text-[#7a5b32]">Bharat Tijori</p>
        </div>
        <div className="flex gap-2">
          <Link href="/enter" className="rounded-full px-4 py-2 text-sm font-semibold">Login</Link>
          <Link href="/join" className="rounded-full bg-[#c65d12] px-4 py-2 text-sm font-semibold text-white">Partner Bano</Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f6b4c]">India ka apna business drive</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight md:text-6xl">India Ke Business Ke Liye</h1>
          <p className="mt-4 max-w-xl text-lg text-[#4b4338]">Bharat ka apna Business Drive. Partner plan lo, company banao, team ko Tijori do. Sirf ₹, sirf India.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/join" className="rounded-full bg-[#1c1915] px-5 py-3 text-sm font-semibold text-white">Partner Bano</Link>
            <Link href="/enter" className="rounded-full border border-[#1c1915] px-5 py-3 text-sm font-semibold">Login</Link>
          </div>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-[#7a5b32]">Partner plan</p>
          <p className="mt-2 text-3xl font-bold">Starter</p>
          <p className="mt-1 text-2xl font-semibold text-[#c65d12]">₹6,999 / Year</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>5 ID</li>
            <li>100 GB storage</li>
            <li>Companies banao aur unka price khud set karo</li>
            <li>Company ko aapka buy price nahi dikhega</li>
          </ul>
        </div>
      </section>

      <section id="features" className="bg-white py-16">
        <div className="mx-auto grid max-w-6xl gap-4 px-5 md:grid-cols-4">
          {FEATURES.map((item) => (
            <article key={item.title} className="rounded-2xl border border-[#efe7da] p-5">
              <h2 className="font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#5c5348]">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-3xl font-bold">Kaise Kaam Karta Hai</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {STEPS.map((step) => (
            <article key={step.n} className="rounded-2xl bg-white p-5">
              <p className="text-sm font-bold text-[#c65d12]">{step.n}</p>
              <h3 className="mt-2 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-[#5c5348]">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#10243e] py-16 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold">Partner Ke Liye</h2>
            <p className="mt-3 text-sm leading-6 text-[#d7e2ef]">Starter lo, company ka monthly ya yearly price set karo, ID aur GB baanto. Profit = selling price minus ₹6,999. Earning aur pending commission dashboard me dikhegi.</p>
          </div>
          <div>
            <h2 className="text-3xl font-bold">Business Ke Liye</h2>
            <p className="mt-3 text-sm leading-6 text-[#d7e2ef]">Jaise Jyoti Footwear. 7 din ka demo, phir apna plan. Employees banao, storage do, Bharat Tijori Drive aur Email Backup kholo.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-3xl font-bold">Security</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5c5348]">Share sirf company ke andar. Link on karo to copy karke WhatsApp ya email pe bhejo. Link off karte hi band. Partner aur Super Admin ko drive files ya email backup nahi dikhte.</p>
      </section>

      <section id="pricing" className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-3xl font-bold">Pricing</h2>
          <p className="mt-2 text-sm text-[#5c5348]">Sirf partner plan. Company ka price partner khud set karta hai, landing pe nahi hai.</p>
          <div className="mt-6 max-w-md rounded-3xl border border-[#efe7da] p-6">
            <p className="text-sm font-semibold text-[#0f6b4c]">Partner Plan</p>
            <p className="mt-2 text-4xl font-bold">₹6,999 <span className="text-lg font-medium">/ Year</span></p>
            <p className="mt-3 text-sm">5 ID · 100 GB</p>
            <Link href="/join" className="mt-6 inline-block rounded-full bg-[#c65d12] px-5 py-3 text-sm font-semibold text-white">Partner Bano</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-3xl font-bold">FAQ</h2>
        <div className="mt-6 space-y-4">
          {FAQS.map((item) => (
            <article key={item.q} className="rounded-2xl bg-white p-5">
              <h3 className="font-semibold">{item.q}</h3>
              <p className="mt-2 text-sm leading-6 text-[#5c5348]">{item.a}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-[#e6dccb] px-5 py-8 text-center text-sm">
        BharatCloud · Made For India
      </footer>
    </div>
  );
}
