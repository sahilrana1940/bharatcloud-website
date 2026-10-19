"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/platform");
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-black font-mono text-red-500">
      GOD MODE LOADING...
    </div>
  );
}
