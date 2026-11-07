/** Restricted mailbox role — must forward to personal inbox to read body. */
export function isOrgUser(session: {
  role?: string;
  saasRole?: string;
  isCompanyOwner?: boolean;
}) {
  const role = String(session.role || "");
  if (role === "org_user") return true;
  return (
    role === "member" &&
    (session.saasRole === "employee" || !session.saasRole) &&
    !session.isCompanyOwner
  );
}

export function emailDomainFromAddress(email: string) {
  return email.trim().toLowerCase().split("@")[1] || "";
}
