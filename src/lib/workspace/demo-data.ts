import type { CompanyUserRow } from "@/lib/workspace/db";

export const DEMO_COMPANY_ID = "demo-company-workspace";

export const DEMO_USERS: CompanyUserRow[] = [
  {
    id: "u1",
    company_id: DEMO_COMPANY_ID,
    email: "admin@rjadam.com",
    role: "admin",
    is_backup_enabled: true,
    drive_used_gb: 14.8,
    drive_limit_gb: 15,
  },
  {
    id: "u2",
    company_id: DEMO_COMPANY_ID,
    email: "sundarbani@rjadam.com",
    role: "member",
    is_backup_enabled: true,
    drive_used_gb: 8.2,
    drive_limit_gb: 15,
  },
  {
    id: "u3",
    company_id: DEMO_COMPANY_ID,
    email: "nowshera@rjadam.com",
    role: "member",
    is_backup_enabled: true,
    drive_used_gb: 5.1,
    drive_limit_gb: 15,
  },
  {
    id: "u4",
    company_id: DEMO_COMPANY_ID,
    email: "rajouri@rjadam.com",
    role: "member",
    is_backup_enabled: false,
    drive_used_gb: 12.0,
    drive_limit_gb: 15,
  },
  {
    id: "u5",
    company_id: DEMO_COMPANY_ID,
    email: "accounts@rjadam.com",
    role: "member",
    is_backup_enabled: true,
    drive_used_gb: 3.4,
    drive_limit_gb: 15,
  },
];

/** Live Google Drive tab (not yet in Safe Drive) */
export const DEMO_GOOGLE_DRIVE_FILES = [
  {
    id: "g-live-1",
    company_id: DEMO_COMPANY_ID,
    drive_file_id: "g-live-1",
    name: "Invoice_March.pdf",
    owner_email: "admin@rjadam.com",
    mime_type: "application/pdf",
    size: 520000,
    web_view_link: "https://drive.google.com",
  },
  {
    id: "g-live-2",
    company_id: DEMO_COMPANY_ID,
    drive_file_id: "g-live-2",
    name: "Team Photo.jpg",
    owner_email: "sundarbani@rjadam.com",
    mime_type: "image/jpeg",
    size: 3100000,
    web_view_link: "https://drive.google.com",
  },
];

export const DEMO_DRIVE_FILES = [
  {
    id: "df1",
    company_id: DEMO_COMPANY_ID,
    owner_email: "sundarbani@rjadam.com",
    drive_file_id: "g1",
    name: "GST Challan Q3.pdf",
    mime_type: "application/pdf",
    size: 2400000,
    web_view_link: "",
    s3_path: "rjadam.com/sundarbani@rjadam.com/GST Challan Q3.pdf",
    backup_status: "backedup" as const,
    is_shortcut: false,
  },
  {
    id: "df2",
    company_id: DEMO_COMPANY_ID,
    owner_email: "rajouri@rjadam.com",
    drive_file_id: "g2",
    name: "Site Photos.zip",
    mime_type: "application/zip",
    size: 89000000,
    web_view_link: "",
    s3_path: "rjadam.com/rajouri@rjadam.com/Site Photos.zip",
    backup_status: "backedup" as const,
    is_shortcut: false,
  },
];

export const DEMO_EMAILS = [
  {
    id: "em1",
    company_id: DEMO_COMPANY_ID,
    owner_email: "sundarbani@rjadam.com",
    gmail_id: "m1",
    subject: "Challan payment reminder",
    from_email: "gst@gov.in",
    date: new Date().toISOString(),
    has_attachment: true,
    body_text: "Please pay challan before due date",
    s3_path: "rjadam.com/sundarbani@rjadam.com/mails/m1.eml",
  },
];
