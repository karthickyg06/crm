import {
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
  DEMO_ADMIN_SALT,
  hashPassword,
  hashPasswordWithSalt,
  verifyPassword,
} from "./password";
import { hasModulePermission, normalizePermissions } from "./permissions";
import { defaultPermissionsForRole } from "./roles";
import type {
  AccountStatus,
  ActionId,
  AuthSession,
  AuthStoreState,
  AuthUser,
  ModuleId,
  ModulePermission,
  RoleId,
} from "./types";

export const AUTH_STORE_VERSION = 1;
const USERS_KEY = "yaglob.auth.users.v1";
const SESSION_KEY = "yaglob.auth.session.v1";

type Listener = () => void;
const listeners = new Set<Listener>();

function canUseStorage() {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
  listeners.forEach((listener) => listener());
}

export function subscribeAuthStore(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function buildSeedAdmin(): Promise<AuthUser> {
  const password = await hashPasswordWithSalt(
    DEMO_ADMIN_PASSWORD,
    DEMO_ADMIN_SALT,
  );
  return {
    id: "user-admin",
    name: "Yaglob Administrator",
    email: DEMO_ADMIN_EMAIL,
    phone: "",
    department: "Administration",
    designation: "Super Admin",
    roleId: "super-admin",
    status: "Active",
    permissions: defaultPermissionsForRole("super-admin"),
    password,
    createdAt: new Date().toISOString(),
  };
}

let seedPromise: Promise<AuthStoreState> | null = null;

async function ensureSeededState(): Promise<AuthStoreState> {
  const existing = readJson<AuthStoreState | null>(USERS_KEY, null);
  if (existing?.version === AUTH_STORE_VERSION && existing.users.length > 0) {
    return existing;
  }
  // Storage empty (e.g. test reset) — drop any stale bootstrap promise.
  seedPromise = null;
  seedPromise = (async () => {
    const admin = await buildSeedAdmin();
    const state: AuthStoreState = {
      version: AUTH_STORE_VERSION,
      users: [admin],
    };
    writeJson(USERS_KEY, state);
    return state;
  })();
  return seedPromise;
}

export function loadAuthState(): AuthStoreState {
  const existing = readJson<AuthStoreState | null>(USERS_KEY, null);
  if (existing?.version === AUTH_STORE_VERSION && existing.users.length > 0) {
    return existing;
  }
  // Sync fallback for SSR / first paint — empty until ensureAuthBootstrapped.
  return { version: AUTH_STORE_VERSION, users: [] };
}

export async function ensureAuthBootstrapped() {
  return ensureSeededState();
}

export function saveAuthState(state: AuthStoreState) {
  writeJson(USERS_KEY, state);
  return state;
}

export function listUsers() {
  return loadAuthState().users.map((user) => ({ ...user }));
}

export function getUserById(id: string) {
  return loadAuthState().users.find((user) => user.id === id) ?? null;
}

export function getUserByEmail(email: string) {
  const normalized = normalizeEmail(email);
  return (
    loadAuthState().users.find(
      (user) => normalizeEmail(user.email) === normalized,
    ) ?? null
  );
}

export function getSession(): AuthSession | null {
  return readJson<AuthSession | null>(SESSION_KEY, null);
}

export function setSession(session: AuthSession | null) {
  if (!session) {
    if (canUseStorage()) {
      window.localStorage.removeItem(SESSION_KEY);
      listeners.forEach((listener) => listener());
    }
    return null;
  }
  writeJson(SESSION_KEY, session);
  return session;
}

export function getCurrentUser(): AuthUser | null {
  const session = getSession();
  if (!session) return null;
  const user = getUserById(session.userId);
  if (!user || user.status !== "Active") {
    setSession(null);
    return null;
  }
  return user;
}

export function userCan(
  user: AuthUser | null | undefined,
  moduleId: ModuleId,
  action: ActionId = "view",
) {
  if (!user || user.status !== "Active") return false;
  return hasModulePermission(user.permissions, moduleId, action);
}

export function currentUserCan(moduleId: ModuleId, action: ActionId = "view") {
  return userCan(getCurrentUser(), moduleId, action);
}

function countActiveSuperAdmins(users: AuthUser[], exceptUserId?: string) {
  return users.filter(
    (user) =>
      user.id !== exceptUserId &&
      user.status === "Active" &&
      user.roleId === "super-admin" &&
      hasModulePermission(user.permissions, "admin-access", "view"),
  ).length;
}

export function assertNotLastSuperAdmin(
  user: AuthUser,
  next?: Partial<AuthUser>,
) {
  if (user.roleId !== "super-admin" || user.status !== "Active") return;
  const users = loadAuthState().users;
  const remaining = countActiveSuperAdmins(users, user.id);
  const nextStatus = next?.status ?? user.status;
  const nextRole = next?.roleId ?? user.roleId;
  const nextPermissions = next?.permissions ?? user.permissions;
  const stillSuper =
    nextStatus === "Active" &&
    nextRole === "super-admin" &&
    hasModulePermission(nextPermissions, "admin-access", "view");
  if (!stillSuper && remaining === 0) {
    throw new Error("Cannot remove or deactivate the last active Super Admin.");
  }
}

export async function loginWithPassword(email: string, password: string) {
  await ensureAuthBootstrapped();
  const user = getUserByEmail(email);
  if (!user) {
    throw new Error("Invalid email or password.");
  }
  if (user.status !== "Active") {
    throw new Error("This account is inactive. Contact your administrator.");
  }
  const ok = await verifyPassword(password, user.password);
  if (!ok) {
    throw new Error("Invalid email or password.");
  }
  const nextUser: AuthUser = {
    ...user,
    lastLoginAt: new Date().toISOString(),
  };
  const state = loadAuthState();
  saveAuthState({
    ...state,
    users: state.users.map((entry) =>
      entry.id === user.id ? nextUser : entry,
    ),
  });
  setSession({
    userId: nextUser.id,
    email: nextUser.email,
    startedAt: new Date().toISOString(),
  });
  return nextUser;
}

export function logout() {
  setSession(null);
}

export type UpsertUserInput = {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  designation: string;
  roleId: RoleId;
  status: AccountStatus;
  permissions?: ModulePermission[];
  temporaryPassword?: string;
};

export async function upsertAuthUser(input: UpsertUserInput) {
  await ensureAuthBootstrapped();
  const state = loadAuthState();
  const email = normalizeEmail(input.email);
  if (!input.name.trim()) throw new Error("Full name is required.");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("A valid email address is required.");
  }

  const duplicate = state.users.find(
    (user) => normalizeEmail(user.email) === email && user.id !== input.id,
  );
  if (duplicate) throw new Error("An account with this email already exists.");

  const permissions = normalizePermissions(
    input.permissions ?? defaultPermissionsForRole(input.roleId),
  );

  if (input.id) {
    const existing = state.users.find((user) => user.id === input.id);
    if (!existing) throw new Error("User not found.");
    assertNotLastSuperAdmin(existing, {
      status: input.status,
      roleId: input.roleId,
      permissions,
    });
    let password = existing.password;
    if (input.temporaryPassword) {
      if (input.temporaryPassword.length < 6) {
        throw new Error("Temporary password must be at least 6 characters.");
      }
      password = await hashPassword(input.temporaryPassword);
    }
    const next: AuthUser = {
      ...existing,
      name: input.name.trim(),
      email,
      phone: input.phone?.trim() || "",
      department: input.department.trim() || "General",
      designation: input.designation.trim() || input.roleId,
      roleId: input.roleId,
      status: input.status,
      permissions,
      password,
    };
    saveAuthState({
      ...state,
      users: state.users.map((user) => (user.id === next.id ? next : user)),
    });
    return next;
  }

  if (!input.temporaryPassword || input.temporaryPassword.length < 6) {
    throw new Error("Temporary password must be at least 6 characters.");
  }
  const password = await hashPassword(input.temporaryPassword);
  const created: AuthUser = {
    id: `user-${Date.now()}`,
    name: input.name.trim(),
    email,
    phone: input.phone?.trim() || "",
    department: input.department.trim() || "General",
    designation: input.designation.trim() || input.roleId,
    roleId: input.roleId,
    status: input.status,
    permissions,
    password,
    createdAt: new Date().toISOString(),
  };
  saveAuthState({ ...state, users: [created, ...state.users] });
  return created;
}

export async function resetUserDemoPassword(userId: string, password: string) {
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }
  const state = loadAuthState();
  const existing = state.users.find((user) => user.id === userId);
  if (!existing) throw new Error("User not found.");
  const nextPassword = await hashPassword(password);
  const next = { ...existing, password: nextPassword };
  saveAuthState({
    ...state,
    users: state.users.map((user) => (user.id === userId ? next : user)),
  });
  return next;
}

export function setUserStatus(userId: string, status: AccountStatus) {
  const state = loadAuthState();
  const existing = state.users.find((user) => user.id === userId);
  if (!existing) throw new Error("User not found.");
  assertNotLastSuperAdmin(existing, { status });
  const next = { ...existing, status };
  saveAuthState({
    ...state,
    users: state.users.map((user) => (user.id === userId ? next : user)),
  });
  if (status === "Inactive") {
    const session = getSession();
    if (session?.userId === userId) setSession(null);
  }
  return next;
}

export function deleteAuthUser(userId: string) {
  const state = loadAuthState();
  const existing = state.users.find((user) => user.id === userId);
  if (!existing) throw new Error("User not found.");
  assertNotLastSuperAdmin(existing, { status: "Inactive", roleId: "employee" });
  saveAuthState({
    ...state,
    users: state.users.filter((user) => user.id !== userId),
  });
  const session = getSession();
  if (session?.userId === userId) setSession(null);
}

export function firstAuthorizedPath(user: AuthUser | null): string {
  if (!user) return "/login";
  const ordered = [
    "dashboard",
    "leads",
    "customers",
    "deals",
    "products",
    "quotations",
    "invoices",
    "payments",
    "vendors",
    "purchase-orders",
    "goods-receiving",
    "inventory",
    "reports",
    "settings",
    "admin-access",
    "development-status",
    "notifications",
  ] as ModuleId[];
  for (const moduleId of ordered) {
    if (userCan(user, moduleId, "view")) {
      if (moduleId === "dashboard") return "/";
      if (moduleId === "admin-access") return "/settings/admin-access";
      if (moduleId === "development-status") {
        return "/settings/development-status";
      }
      if (moduleId === "notifications") return "/settings/notifications";
      if (moduleId === "settings") return "/settings";
      return `/${moduleId === "purchase-orders" ? "purchase-orders" : moduleId === "goods-receiving" ? "goods-receiving" : moduleId}`;
    }
  }
  return "/access-denied";
}

/** Public path helpers for route maps */
export function modulePath(moduleId: ModuleId): string {
  switch (moduleId) {
    case "dashboard":
      return "/";
    case "admin-access":
      return "/settings/admin-access";
    case "development-status":
      return "/settings/development-status";
    case "notifications":
      return "/settings/notifications";
    case "purchase-orders":
      return "/purchase-orders";
    case "goods-receiving":
      return "/goods-receiving";
    default:
      return `/${moduleId}`;
  }
}
