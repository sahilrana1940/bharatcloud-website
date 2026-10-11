import type { drive_v3 } from "googleapis";

import { driveClient } from "@/lib/google/client";

export type GoogleDriveStorageQuota = {
  usedBytes: number;
  limitBytes: number | null;
  usedGb: number;
  limitGb: number | null;
  usageInDriveBytes: number;
};

function bytesToGb(bytes: number): number {
  return Math.round((bytes / 1024 ** 3) * 100) / 100;
}

/** `drive.about.get` — storage quota for connected user. */
export async function fetchDriveAbout(
  accessToken: string,
): Promise<{ quota: GoogleDriveStorageQuota; user?: drive_v3.Schema$User }> {
  const drive = driveClient(accessToken);
  if (!drive) throw new Error("Drive client unavailable");

  const res = await drive.about.get({
    fields: "user,storageQuota(limit,usage,usageInDrive,usageInDriveTrash)",
  });

  const sq = res.data.storageQuota;
  const usageInDriveBytes = Number(sq?.usageInDrive ?? sq?.usage ?? 0);
  const usedBytes = Number(sq?.usage ?? usageInDriveBytes);
  const limitRaw = sq?.limit;
  const limitBytes =
    limitRaw != null && limitRaw !== "" ? Number(limitRaw) : null;

  const quota: GoogleDriveStorageQuota = {
    usedBytes,
    limitBytes,
    usageInDriveBytes,
    usedGb: bytesToGb(usageInDriveBytes || usedBytes),
    limitGb: limitBytes != null ? bytesToGb(limitBytes) : null,
  };

  return { quota, user: res.data.user };
}

export type DriveListPage = {
  files: drive_v3.Schema$File[];
  nextPageToken: string | null;
  count: number;
};

/** `drive.files.list` — first page (validates readonly scope). */
export async function fetchDriveFilesListPage(
  accessToken: string,
  opts?: { pageSize?: number; pageToken?: string },
): Promise<DriveListPage> {
  const drive = driveClient(accessToken);
  if (!drive) throw new Error("Drive client unavailable");

  const listed = await drive.files.list({
    pageSize: opts?.pageSize ?? 50,
    pageToken: opts?.pageToken,
    fields: "nextPageToken, files(id,name,mimeType,size,webViewLink,owners)",
    q: "trashed=false",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const files = listed.data.files || [];
  return {
    files,
    nextPageToken: listed.data.nextPageToken ?? null,
    count: files.length,
  };
}
