export type FixCommand = "FIX_FORWARD" | "COLLECT_RENT" | "FORCE_UPGRADE" | "RESCAN";

export type FixLogLine = {
  id: string;
  at: string;
  command: FixCommand;
  tenant: string;
  result: string;
};

const RESULT: Record<FixCommand, (tenant: string) => string> = {
  FIX_FORWARD: (tenant) =>
    `cron tick: forward block cleared for ${tenant}. Pending seats moved to invoice.`,
  COLLECT_RENT: (tenant) =>
    `cron tick: rent collect opened for ${tenant}. Backup stays off until paid. Storage remains safe.`,
  FORCE_UPGRADE: (tenant) =>
    `cron tick: pro-rata upgrade forced for ${tenant}. ID cap raised after payment.`,
  RESCAN: (tenant) =>
    `cron tick: GoDaddy rescan queued for ${tenant}. Active mailbox count will refresh.`,
};

/** Mock cron action. Swap the body later without renaming the export. */
export function runAutoFix(command: FixCommand, tenant: string): FixLogLine {
  return {
    id: `${command}-${Date.now()}`,
    at: new Date().toISOString(),
    command,
    tenant,
    result: RESULT[command](tenant),
  };
}
