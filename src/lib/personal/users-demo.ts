type UserPlan = {
  user_email: string;
  plan: "free" | "year_20gb" | "year_100gb";
  storage_limit_bytes: number;
  storage_used_bytes: number;
  plan_expires_at: string | null;
};

const users = new Map<string, UserPlan>();

export function demoGetUser(email: string): UserPlan {
  const e = email.toLowerCase();
  if (!users.has(e)) {
    users.set(e, {
      user_email: e,
      plan: "free",
      storage_limit_bytes: 2 * 1024 ** 3,
      storage_used_bytes: 0,
      plan_expires_at: null,
    });
  }
  return users.get(e)!;
}

export function demoUpdateUser(email: string, patch: Partial<UserPlan>) {
  const u = demoGetUser(email);
  users.set(email.toLowerCase(), { ...u, ...patch });
}
