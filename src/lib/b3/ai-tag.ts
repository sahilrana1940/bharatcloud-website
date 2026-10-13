/** Mock AI classifier — filename heuristics until a real model is wired. */
export function inferB3AiTag(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes("invoice") || lower.includes("bill")) return "finance";
  if (lower.includes("contract") || lower.includes("agreement")) return "legal";
  if (/\.(jpg|jpeg|png|gif|webp|heic)$/i.test(lower)) return "media";
  if (lower.includes("payroll") || lower.includes("salary")) return "hr";
  return "general";
}
