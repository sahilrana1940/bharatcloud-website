type UserPlan = {
  email: string;
  plan: "free" | "plus" | "pro";
  storage_limit: number;
  storage_used: number;
  plan_expiry: string | null;
  is_paid: boolean;
  is_blocked: boolean;
};

const users = new Map<string, UserPlan>();

export function demoGetUser(email: string): UserPlan {
  const e = email.toLowerCase();
  if (!users.has(e)) {
    users.set(e, {
      email: e,
      plan: "free",
      storage_limit: 2 * 1024 ** 3,
      storage_used: 0,
      plan_expiry: null,
      is_paid: false,
      is_blocked: false,
    });
  }
  return users.get(e)!;
}

export function demoAllUsers() {
  return [...users.values()];
}

export function demoUpdateUser(email: string, patch: Partial<UserPlan>) {
  const u = demoGetUser(email);
  users.set(email.toLowerCase(), { ...u, ...patch });
}
