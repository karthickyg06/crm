import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  assertNotLastSuperAdmin,
  deleteAuthUser,
  ensureAuthBootstrapped,
  firstAuthorizedPath,
  getCurrentUser,
  listUsers,
  loginWithPassword,
  logout,
  setUserStatus,
  upsertAuthUser,
  userCan,
} from "./authStore";
import {
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
  hashPassword,
  verifyPassword,
} from "./password";
import { hasModulePermission, normalizePermissions } from "./permissions";
import { defaultPermissionsForRole } from "./roles";
import {
  computeDevProgress,
  listDevFeatures,
  loadDevRegistry,
  updateDevFeature,
} from "./devRegistry";
import { resetDemoData, loadCustomers } from "@/features/erp/demoStore";

function mockStorage() {
  const store: Record<string, string> = {};
  const storage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
  vi.stubGlobal("localStorage", storage);
  vi.stubGlobal("sessionStorage", storage);
  return store;
}

describe("Auth password hashing", () => {
  it("verifies PBKDF2-SHA-256 hashes", async () => {
    const record = await hashPassword("Secret#99");
    expect(record.algo).toBe("PBKDF2-SHA-256");
    expect(await verifyPassword("Secret#99", record)).toBe(true);
    expect(await verifyPassword("wrong", record)).toBe(false);
  });
});

describe("Auth store and permissions", () => {
  let store: Record<string, string>;

  beforeEach(async () => {
    store = mockStorage();
    await ensureAuthBootstrapped();
  });

  it("seeds the demo Super Admin and logs in", async () => {
    const users = listUsers();
    expect(users).toHaveLength(1);
    expect(users[0]?.email).toBe(DEMO_ADMIN_EMAIL);
    expect(users[0]?.roleId).toBe("super-admin");

    const user = await loginWithPassword(DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD);
    expect(user.email).toBe(DEMO_ADMIN_EMAIL);
    expect(getCurrentUser()?.id).toBe(user.id);
    expect(userCan(user, "admin-access", "view")).toBe(true);
    expect(userCan(user, "development-status", "edit")).toBe(true);
    expect(userCan(user, "notifications", "view")).toBe(true);
  });

  it("rejects invalid credentials and inactive accounts", async () => {
    await expect(
      loginWithPassword(DEMO_ADMIN_EMAIL, "bad-password"),
    ).rejects.toThrow(/Invalid email or password/i);

    await upsertAuthUser({
      name: "Backup Admin",
      email: "backup-admin@yaglob.com",
      department: "Administration",
      designation: "Super Admin",
      roleId: "super-admin",
      status: "Active",
      temporaryPassword: "Temp@123",
    });
    const admin = listUsers().find((user) => user.email === DEMO_ADMIN_EMAIL)!;
    setUserStatus(admin.id, "Inactive");
    await expect(
      loginWithPassword(DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD),
    ).rejects.toThrow(/inactive/i);
  });

  it("clears only the session on logout", async () => {
    await loginWithPassword(DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD);
    expect(store["yaglob.auth.session.v1"]).toBeTruthy();
    logout();
    expect(getCurrentUser()).toBeNull();
    expect(store["yaglob.auth.session.v1"]).toBeUndefined();
    expect(store["yaglob.auth.users.v1"]).toBeTruthy();
  });

  it("denies by default and grants configured actions", () => {
    const employee = {
      ...listUsers()[0]!,
      roleId: "employee" as const,
      permissions: defaultPermissionsForRole("employee"),
    };
    expect(userCan(employee, "invoices", "view")).toBe(false);
    expect(userCan(employee, "leads", "view")).toBe(true);
    expect(userCan(employee, "leads", "delete")).toBe(true);
    expect(hasModulePermission(employee.permissions, "leads", "import")).toBe(
      true,
    );
  });

  it("creates users with email, temporary password, and role", async () => {
    const created = await upsertAuthUser({
      name: "Sales User",
      email: "sales@yaglob.com",
      department: "Sales",
      designation: "Sales Executive",
      roleId: "sales-executive",
      status: "Active",
      temporaryPassword: "Temp@123",
    });
    expect(created.email).toBe("sales@yaglob.com");
    expect(created.roleId).toBe("sales-executive");

    const session = await loginWithPassword("sales@yaglob.com", "Temp@123");
    expect(session.id).toBe(created.id);
    expect(firstAuthorizedPath(session)).toBe("/");
    expect(userCan(session, "deals", "view")).toBe(true);
    expect(userCan(session, "payments", "view")).toBe(false);
  });

  it("protects the last active Super Admin", async () => {
    const admin = listUsers()[0]!;
    expect(() =>
      assertNotLastSuperAdmin(admin, { status: "Inactive" }),
    ).toThrow(/last active Super Admin/i);
    expect(() => deleteAuthUser(admin.id)).toThrow(/last active Super Admin/i);

    await upsertAuthUser({
      name: "Second Admin",
      email: "admin2@yaglob.com",
      department: "Administration",
      designation: "Super Admin",
      roleId: "super-admin",
      status: "Active",
      temporaryPassword: "Temp@123",
    });
    expect(() => setUserStatus(admin.id, "Inactive")).not.toThrow();
  });

  it("redirects users without dashboard to first authorized module", async () => {
    const accountant = await upsertAuthUser({
      name: "Books",
      email: "books@yaglob.com",
      department: "Finance",
      designation: "Accountant",
      roleId: "accountant",
      status: "Active",
      temporaryPassword: "Temp@123",
      permissions: normalizePermissions([
        { moduleId: "invoices", actions: ["view", "create"] },
        { moduleId: "payments", actions: ["view"] },
      ]),
    });
    expect(userCan(accountant, "dashboard", "view")).toBe(false);
    expect(firstAuthorizedPath(accountant)).toBe("/invoices");
  });

  it("returns access-denied when no modules are assigned", async () => {
    const locked = await upsertAuthUser({
      name: "Locked",
      email: "locked@yaglob.com",
      department: "None",
      designation: "Custom",
      roleId: "custom",
      status: "Active",
      temporaryPassword: "Temp@123",
      permissions: [],
    });
    expect(firstAuthorizedPath(locked)).toBe("/access-denied");
  });

  it("preserves auth keys when demo business data is reset", async () => {
    await loginWithPassword(DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD);
    await upsertAuthUser({
      name: "Keep Me",
      email: "keep@yaglob.com",
      department: "Ops",
      designation: "Manager",
      roleId: "manager",
      status: "Active",
      temporaryPassword: "Temp@123",
    });
    loadDevRegistry();
    const authBefore = store["yaglob.auth.users.v1"];
    const sessionBefore = store["yaglob.auth.session.v1"];
    const devBefore = store["yaglob.dev.registry.v1"];
    expect(authBefore).toBeTruthy();
    expect(devBefore).toBeTruthy();

    resetDemoData();
    expect(loadCustomers().length).toBeGreaterThan(0);
    expect(store["yaglob.auth.users.v1"]).toBe(authBefore);
    expect(store["yaglob.auth.session.v1"]).toBe(sessionBefore);
    expect(store["yaglob.dev.registry.v1"]).toBe(devBefore);
    expect(listUsers().some((user) => user.email === "keep@yaglob.com")).toBe(
      true,
    );
  });
});

describe("Development status registry", () => {
  beforeEach(() => {
    mockStorage();
  });

  it("seeds features and computes progress percentages", () => {
    const features = listDevFeatures();
    expect(features.length).toBeGreaterThan(10);
    const progress = computeDevProgress(features);
    const current = features.filter((feature) => feature.track === "current");
    const roadmap = features.filter((feature) => feature.track === "roadmap");
    expect(progress.total).toBe(current.length);
    expect(roadmap.length).toBeGreaterThan(40);
    expect(
      progress.implemented +
        progress.inProgress +
        progress.pending +
        progress.blocked +
        progress.upcoming,
    ).toBe(progress.total);
    expect(progress.percentage).toBeGreaterThanOrEqual(0);
    expect(progress.percentage).toBeLessThanOrEqual(100);
    expect(features.some((f) => f.id === "dashboard")).toBe(true);
    expect(
      features.some(
        (f) => f.id === "auth-rbac" || f.name.toLowerCase().includes("auth"),
      ),
    ).toBe(true);
    expect(roadmap.every((feature) => feature.status === "upcoming")).toBe(
      true,
    );
    expect(features.find((f) => f.id === "whatsapp-email")?.status).toBe(
      "blocked",
    );
  });

  it("keeps implementation percentage independent of roadmap size", () => {
    const features = listDevFeatures();
    const progress = computeDevProgress(features);
    const currentImplemented = features.filter(
      (feature) =>
        feature.track === "current" && feature.status === "implemented",
    ).length;
    const expected =
      Math.round((currentImplemented / progress.total) * 1000) / 10;
    expect(progress.percentage).toBe(expected);
    expect(progress.total).toBeLessThan(features.length);
  });

  it("allows status and notes updates", () => {
    const features = listDevFeatures();
    const target = features[0]!;
    updateDevFeature(target.id, {
      status: "in-progress",
      notes: "Verified in auth tests",
      testingStatus: "unit-covered",
    });
    const updated = listDevFeatures().find((f) => f.id === target.id);
    expect(updated?.status).toBe("in-progress");
    expect(updated?.notes).toContain("Verified");
  });
});
