import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ensureAuthBootstrapped,
  loginWithPassword,
  upsertAuthUser,
  userCan,
} from "@/features/auth/authStore";
import {
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
} from "@/features/auth/password";
import { defaultPermissionsForRole } from "@/features/auth/roles";
import {
  getProfileMenuVisibility,
  getSidebarPrimaryPaths,
  resolveHeaderPageLabel,
} from "@/features/crm/navigation";

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
}

describe("Admin navigation refinement", () => {
  beforeEach(async () => {
    mockStorage();
    await ensureAuthBootstrapped();
  });

  it("keeps business modules in the sidebar and omits admin destinations", () => {
    const paths = getSidebarPrimaryPaths();
    expect(paths).toContain("/reports");
    expect(paths).toContain("/leads");
    expect(paths).not.toContain("/settings");
    expect(paths).not.toContain("/settings/admin-access");
    expect(paths).not.toContain("/settings/development-status");
  });

  it("resolves header labels without treating settings children as Settings", () => {
    expect(resolveHeaderPageLabel("/settings")).toBe("Settings");
    expect(resolveHeaderPageLabel("/settings/admin-access")).toBe(
      "Admin Access",
    );
    expect(resolveHeaderPageLabel("/settings/development-status")).toBe(
      "Development Status",
    );
    expect(resolveHeaderPageLabel("/reports")).toBe("Reports");
  });

  it("shows admin profile links only for Super Admin permissions", async () => {
    const admin = await loginWithPassword(
      DEMO_ADMIN_EMAIL,
      DEMO_ADMIN_PASSWORD,
    );
    const adminMenu = getProfileMenuVisibility((moduleId, action = "view") =>
      userCan(admin, moduleId, action),
    );
    expect(adminMenu.showProfile).toBe(true);
    expect(adminMenu.showAdminAccess).toBe(true);
    expect(adminMenu.showDevelopmentStatus).toBe(true);

    const employee = await upsertAuthUser({
      name: "Employee User",
      email: "employee.nav@yaglob.com",
      department: "Ops",
      designation: "Employee",
      roleId: "employee",
      status: "Active",
      temporaryPassword: "Temp@123",
      permissions: defaultPermissionsForRole("employee"),
    });
    const employeeMenu = getProfileMenuVisibility((moduleId, action = "view") =>
      userCan(employee, moduleId, action),
    );
    expect(employeeMenu.showAdminAccess).toBe(false);
    expect(employeeMenu.showDevelopmentStatus).toBe(false);
  });
});
