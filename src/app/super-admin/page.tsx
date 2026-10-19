"use client";
import { useState } from "react";

export default function SuperAdmin() {
  const [active, setActive] = useState("Dashboard");
  
  const menu = [
    "Dashboard","All Workspaces","All Members","Storage Tiers",
    "Gmail Connect Approvals","Drive Approvals","Central Drive",
    "Backup Admin","Platform Storage","Infra Billing Rs1700 Fixed","Settings"
  ];

  return (
    <div className="flex min-h-screen bg-[#0A0A0A] text-white">
      {/* SIDEBAR */}
      <div className="w-64 bg-[#141414] border-r border-white/10 p-4">
        <h2 className="font-bold text-orange-400 mb-6">BHARATCLOUD SUPER ADMIN</h2>
        {menu.map(item => (
          <div 
            key={item}
            onClick={() => setActive(item)}
            className={`p-3 mb-1 rounded cursor-pointer ${active===item ? 'bg-[#1F1F1F] border-l-2 border-[#22C55E] text-white' : 'text-white/60 hover:bg-[#1A1A1A]'}`}
          >
            {item}
          </div>
        ))}
      </div>

      {/* MAIN */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#1F1F1F] border-t-2 border-[#22C55E] p-6 rounded-xl">
            <p className="text-white/60 text-sm">Total Workspace</p>
            <h3 className="text-4xl font-bold mt-2">50</h3>
          </div>
          <div className="bg-[#1F1F1F] border-t-2 border-[#FF4D4D] p-6 rounded-xl">
            <p className="text-white/60 text-sm">Storage Used</p>
            <h3 className="text-4xl font-bold mt-2">90</h3>
          </div>
          <div className="bg-[#1F1F1F] border-t-2 border-[#FB923C] p-6 rounded-xl">
            <p className="text-white/60 text-sm">Gmail Pending</p>
            <h3 className="text-4xl font-bold mt-2">3</h3>
          </div>
          <div className="bg-[#1F1F1F] border-t-2 border-[#38BDF8] p-6 rounded-xl">
            <p className="text-white/60 text-sm">Drive Pending</p>
            <h3 className="text-4xl font-bold mt-2">2</h3>
          </div>
          <div className="bg-[#1F1F1F] border-t-2 border-[#A855F7] p-6 rounded-xl">
            <p className="text-white/60 text-sm">Backup Count</p>
            <h3 className="text-4xl font-bold mt-2">0</h3>
          </div>
          <div className="bg-[#1F1F1F] border-t-2 border-[#22C55E] p-6 rounded-xl font-mono">
            <p className="text-white/60 text-sm">Infra Cost</p>
            <h3 className="text-2xl font-bold mt-2 text-[#22C55E]">Rs1700 Fixed</h3>
            <p className="text-xs text-white/40">Mumbai E2E Only</p>
          </div>
        </div>

        <div className="mt-8 bg-[#1F1F1F] rounded-xl p-6 border border-white/10">
          <h4 className="font-bold">{active}</h4>
          <p className="text-white/60 mt-2 text-sm">
            {active==="All Workspaces" ? "Acme Pvt Ltd - 20 IDs - Active - 300GB | Jammu CA - 5 IDs" : 
             active==="All Members" ? "0 members - No workspaces yet (mock fallback)" :
             "Data loading with mock fallback - No infinite Loading..."}
          </p>
        </div>
      </div>
    </div>
  );
}