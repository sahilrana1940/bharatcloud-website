import type { B3FileRecord } from "@/lib/b3/types";

const store = new Map<string, B3FileRecord[]>();

function seed(companyId: string): B3FileRecord[] {
  const now = Date.now();
  return [
    {
      id: `b3-demo-1-${companyId.slice(0, 6)}`,
      companyId,
      fileName: "Q3-GST-Invoice.pdf",
      fileUrl: "https://blob.vercel-storage.com/demo-b3/gst-invoice.pdf",
      fileSize: 890 * 1024 * 1024,
      aiTag: "finance",
      createdAt: new Date(now - 5 * 86400000).toISOString(),
    },
    {
      id: `b3-demo-2-${companyId.slice(0, 6)}`,
      companyId,
      fileName: "Company-Handbook.pdf",
      fileUrl: "https://blob.vercel-storage.com/demo-b3/handbook.pdf",
      fileSize: 1.2 * 1024 * 1024 * 1024,
      aiTag: "general",
      createdAt: new Date(now - 12 * 86400000).toISOString(),
    },
    {
      id: `b3-demo-3-${companyId.slice(0, 6)}`,
      companyId,
      fileName: "Rajouri-Hub-Photos.zip",
      fileUrl: "https://blob.vercel-storage.com/demo-b3/hub-photos.zip",
      fileSize: 2.1 * 1024 * 1024 * 1024,
      aiTag: "media",
      createdAt: new Date(now - 2 * 86400000).toISOString(),
    },
  ];
}

export function demoB3List(companyId: string): B3FileRecord[] {
  if (!store.has(companyId)) {
    store.set(companyId, seed(companyId));
  }
  return [...store.get(companyId)!];
}

export function demoB3Insert(companyId: string, row: B3FileRecord): B3FileRecord {
  const list = demoB3List(companyId);
  list.unshift(row);
  store.set(companyId, list);
  return row;
}
