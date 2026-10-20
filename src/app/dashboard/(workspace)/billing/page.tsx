"use client"
import { useState } from 'react'

export default function BillingPage() {
  return (
    <div className="flex min-h-screen bg-[#f5f7fa]">
      {/* Sidebar - E2E Style */}
      <div className="w-64 bg-[#0f1e3a] text-white p-4">
        <h1 className="text-xl font-bold mb-8">☁️ BharatCloud</h1>
        <nav className="space-y-2">
          <a className="block p-3 rounded hover:bg-white/10">Dashboard</a>
          <a className="block p-3 rounded hover:bg-white/10">Compute</a>
          <a className="block p-3 rounded hover:bg-white/10">Storage</a>
          <a className="block p-3 rounded hover:bg-white/10">Database</a>
          <a className="block p-3 rounded hover:bg-white/10">Network</a>
          <a className="block p-3 rounded bg-[#1e3a6a] text-white">Billing</a>
          <a className="block p-3 rounded hover:bg-white/10">Settings</a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">Billing</h1>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Left - Invoice Card - Same as your screenshot */}
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-4xl">💳</div>
              <div className="h-6 w-6 rounded-full bg-black text-white flex items-center justify-center text-xs">✓</div>
            </div>
            
            <div className="space-y-4 text-[15px]">
              <div className="flex justify-between">
                <span>Cost of Infra credits:</span>
                <span className="font-medium">₹ 100.0</span>
              </div>
              <div className="flex justify-between">
                <span>GST :</span>
                <span className="font-medium">₹ 0</span>
              </div>
              <div className="flex justify-between border-t pt-4">
                <span>Total invoice amount :<br/><span className="text-xs text-gray-500">All plans inclusive of taxes | GST Not Applicable</span></span>
                <span className="font-medium">₹ 100.0</span>
              </div>
              <div className="flex justify-between bg-gray-100 p-3 rounded-lg font-bold">
                <span>Net Payable Amount</span>
                <span>₹ 100.0</span>
              </div>
            </div>

            <button 
              onClick={() => alert('Razorpay Payment Open')}
              className="w-full mt-6 bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-900"
            >
              Proceed to pay
            </button>
          </div>

          {/* Right - History */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-bold mb-4">Billing History</h3>
            <p className="text-sm text-gray-500">Teri purani invoices yahan ayengi...</p>
          </div>
        </div>
      </div>
    </div>
  )
}