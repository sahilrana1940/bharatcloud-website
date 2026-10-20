const SUPER_ADMIN_EMAIL = "support@bharatcloud.store";

export type CommandLog = {
  id: string;
  timestamp: string;
  emp: string;
  action: string;
  details: string;
  status: "Success";
};

const SEED: CommandLog[] = [
  {
    id: "log-1",
    timestamp: "21:42:10",
    emp: SUPER_ADMIN_EMAIL,
    action: "System initialized",
    details: "Secure env",
    status: "Success",
  },
  {
    id: "log-2",
    timestamp: "21:37:52",
    emp: SUPER_ADMIN_EMAIL,
    action: "Heartbeat check",
    details: "All services nominal",
    status: "Success",
  },
  {
    id: "log-3",
    timestamp: "21:35:10",
    emp: SUPER_ADMIN_EMAIL,
    action: "Cache cleared",
    details: "Bug Fix Panel",
    status: "Success",
  },
  {
    id: "log-4",
    timestamp: "21:30:22",
    emp: SUPER_ADMIN_EMAIL,
    action: "Tenant added",
    details: "EMP-0001",
    status: "Success",
  },
];

const undone = new Set<string>();
let logsCleared = false;

export function listCommandLogs(): CommandLog[] {
  if (logsCleared) return [];
  return SEED.filter((row) => !undone.has(row.id));
}

export function undoCommandLog(actionId: string) {
  undone.add(actionId);
  return { message: "Undone" as const };
}

export function clearCommandLogs() {
  logsCleared = true;
}

export type AdminEmployee = {
  id: string;
  name: string;
  email: string;
  role: string;
  lastAction: string;
  status: "ACTIVE";
};

export const COMMAND_EMPLOYEE: AdminEmployee = {
  id: "EMP-0001",
  name: "Super Admin",
  email: SUPER_ADMIN_EMAIL,
  role: "SUPERADMIN",
  lastAction: "Authenticated via SSO • 21:42:10 IST",
  status: "ACTIVE",
};

const addedEmployees: AdminEmployee[] = [];

export function listMemoryEmployees() {
  return [COMMAND_EMPLOYEE, ...addedEmployees];
}

export function addMemoryEmployee(row: AdminEmployee) {
  addedEmployees.push(row);
}

export function deleteMemoryEmployee(id: string) {
  const index = addedEmployees.findIndex((row) => row.id === id);
  if (index >= 0) addedEmployees.splice(index, 1);
}

export const REAL_STATS = {
  revenue: 0,
  tenants: 4,
  users: 0,
  storageUsed: 0,
  storageTotal: 0,
  upi: 0,
  gmail: 0,
  members: 0,
  infra: { vm: 800, storage: 600, bandwidth: 300, total: 1700 },
};
