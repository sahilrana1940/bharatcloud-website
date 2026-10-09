export type DummyFile = {
  id: string;
  name: string;
  type: "doc" | "sheet" | "image" | "pdf";
  sizeMb: number;
  updatedAt: string;
  owner: string;
};

export const DUMMY_FILES: DummyFile[] = [
  {
    id: "1",
    name: "GST Returns Q3.pdf",
    type: "pdf",
    sizeMb: 4.2,
    updatedAt: "2026-10-08T10:00:00Z",
    owner: "You",
  },
  {
    id: "2",
    name: "Vendor Contracts",
    type: "doc",
    sizeMb: 1.1,
    updatedAt: "2026-10-07T14:30:00Z",
    owner: "Priya",
  },
  {
    id: "3",
    name: "Field Photos — Mumbai",
    type: "image",
    sizeMb: 12.8,
    updatedAt: "2026-10-06T09:15:00Z",
    owner: "Team",
  },
  {
    id: "4",
    name: "FY26 Budget.xlsx",
    type: "sheet",
    sizeMb: 0.8,
    updatedAt: "2026-10-05T16:00:00Z",
    owner: "You",
  },
  {
    id: "5",
    name: "MSA Template.docx",
    type: "doc",
    sizeMb: 0.3,
    updatedAt: "2026-10-04T11:20:00Z",
    owner: "Legal",
  },
  {
    id: "6",
    name: "Onboarding Deck.pdf",
    type: "pdf",
    sizeMb: 2.4,
    updatedAt: "2026-10-03T08:45:00Z",
    owner: "HR",
  },
];

export const DUMMY_TEAM = [
  { name: "You", email: "admin@company.com", role: "Admin" },
  { name: "Priya Sharma", email: "priya@company.com", role: "Editor" },
  { name: "Rahul Mehta", email: "rahul@company.com", role: "Viewer" },
];
