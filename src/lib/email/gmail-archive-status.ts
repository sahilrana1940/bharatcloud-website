import type { SupabaseClient } from "@supabase/supabase-js";

import { resolveMailboxScope } from "@/lib/archive/mailbox-scope";
import {
  countBackedUpEmails,
  getLastGmailPageToken,
  gmailMailboxCount,
  listEmailBackupRuns,
} from "@/lib/email/e2e-gmail-backup";

export async function getGmailArchiveStatus(
  supabase: SupabaseClient,
  session: { companyId: string; email: string },
) {
  const scope = await resolveMailboxScope(supabase, session.companyId, session.email);
  const backedUpCount = await countBackedUpEmails(
    supabase,
    scope.companyId,
    scope.email,
    scope.userId,
  );
  const mailbox = await gmailMailboxCount(supabase, scope.companyId, scope.email);
  const messagesTotal = "messagesTotal" in mailbox ? mailbox.messagesTotal : null;
  const gmailError = "error" in mailbox ? mailbox.error : null;
  const { runs } = await listEmailBackupRuns(supabase, scope.companyId, scope.email, 3, scope.userId);
  const lastRun = runs[0] as Record<string, unknown> | undefined;
  const running = lastRun?.status === "running";
  const nextPageToken = await getLastGmailPageToken(
    supabase,
    scope.companyId,
    scope.email,
    scope.userId,
  );
  const hasMore =
    messagesTotal != null &&
    backedUpCount < messagesTotal &&
    (Boolean(nextPageToken) || running || lastRun?.status === "completed");

  const archivedLastBatch = Number(lastRun?.archived_count ?? lastRun?.email_count) || 0;

  return {
    archivedPerUser: backedUpCount,
    totalGmailPerUser: messagesTotal,
    backedUpCount,
    messagesTotal,
    hasMore,
    running,
    nextPageToken,
    lastRun,
    archivedLastBatch,
    gmailError,
    tokenExpired: "tokenExpired" in mailbox ? Boolean(mailbox.tokenExpired) : false,
    progress:
      messagesTotal != null
        ? `Archiving in background ${backedUpCount.toLocaleString()}/${messagesTotal.toLocaleString()}… will continue automatically`
        : gmailError || "Gmail not connected",
  };
}
