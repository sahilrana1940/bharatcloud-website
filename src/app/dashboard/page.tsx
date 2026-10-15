"use client"
import { useState, useEffect } from "react"

type Company = {
  id: string
  name: string
  owner: string
  members: number
  storage: string
  plan: string
}

export default function UniversalPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [scope, setScope] = useState("All")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        // YAHAN SE REAL DATA AYEGA
        // const res = await fetch('/api/companies')
        // const data = await res.json()
        // setCompanies(data)

        // Demo ke liye - jab tak API nahi hai, empty rakho ya localStorage se lo
        // Jo bhi company register hogi, wo yahan automatic ayegi
        setCompanies([])
      } catch (e) {
        console.log(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = scope === "All"? companies : companies.filter(c => c.id === scope)

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans">
      {/* SIDEBAR */}
      <aside className="w-[320px] bg-white border-r flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b">
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-black">BC</div>
            <div>
              <div className="font-black">BharatCloud</div>
              <div className="text-[10px] text-gray-400 tracking-widest">UNIVERSAL</div>
            </div>
          </div>
        </div>

        <div className="p-4">
          <label className="text-[11px] font-bold text-gray-400">COMPANY SCOPE</label>
          <select
            value={scope}
            onChange={e => setScope(e.target.value)}
            className="w-full mt-2 border rounded-xl px-3 py-3 text-sm bg-white"
          >
            <option value="All">🌐 All Companies ({companies.length})</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="p-4 space-y-2 text-sm">
          <div className="bg-blue-600 text-white p-3 rounded-xl">Universal Overview</div>
          <div className="p-3 hover:bg-gray-50 rounded-xl">🏢 Companies: {companies.length}</div>
          <div className="p-3 hover:bg-gray-50 rounded-xl">👥 Members</div>
          <div className="p-3 hover:bg-gray-50 rounded-xl">💾 Storage</div>
        </div>

        <div className="mt-auto p-4 border-t">
          <div className="text-xs bg-black text-white p-3 rounded-xl">support@bharatcloud.store</div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-10">
        <h1 className="text-4xl font-black">Universal Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">Koi hardcoded naam nahi - jo register karega wahi dikhega</p>

        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="bg-white border p-6 rounded-2xl">
            <div className="text-3xl font-black">{companies.length}</div>
            <div className="text-sm text-gray-500">Total Companies</div>
          </div>
          <div className="bg-white border p-6 rounded-2xl">
            <div className="text-3xl font-black">{companies.reduce((a,b)=>a+b.members,0)}</div>
            <div className="text-sm text-gray-500">Total Members</div>
          </div>
          <div className="bg-black text-white p-6 rounded-2xl">
            <div className="text-3xl font-black">Ready</div>
            <div className="text-sm opacity-60">Universal Mode</div>
          </div>
        </div>

        {loading? (
          <div className="mt-10">Loading...</div>
        ) : companies.length === 0? (
          <div className="mt-10 bg-white border-2 border-dashed rounded-2xl p-16 text-center">
            <div className="text-5xl">🏢</div>
            <div className="font-bold mt-4 text-xl">Universal Ready</div>
            <div className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
              Abhi koi company nahi hai. Jaise hi koi bhi user register karega -
              chahe wo <b>mahadev@gmail.com</b> ho ya <b>rajesh@mahadev.com</b> ya koi bhi -
              wo automatic yahan aa jayega. <br/><br/>
              API: <code className="bg-gray-100 px-2 py-1 rounded">/api/companies</code> se connect karna hai.
            </div>
          </div>
        ) : (
          <div className="mt-10 bg-white border rounded-2xl p-6">
            {filtered.map(c => (
              <div key={c.id} className="flex justify-between p-4 border rounded-xl mb-3">
                <div>
                  <div className="font-bold">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.owner}</div>
                </div>
                <div className="text-sm">{c.plan}</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}