import { redirect } from "@tanstack/react-router";

import {
  ensureAuthBootstrapped,
  firstAuthorizedPath,
  getCurrentUser,
  userCan,
} from "./authStore";
import { pathToModuleId } from "./permissions";
import type { ActionId, ModuleId } from "./types";

export async function requireAuthSession() {
  await ensureAuthBootstrapped();
  const user = getCurrentUser();
  if (!user) {
    throw redirect({ to: "/login" });
  }
  return user;
}

export async function requireGuest() {
  await ensureAuthBootstrapped();
  const user = getCurrentUser();
  if (user) {
    throw redirect({ to: firstAuthorizedPath(user) });
  }
}

export async function requireModuleAccess(
  moduleId: ModuleId,
  action: ActionId = "view",
) {
  const user = await requireAuthSession();
  if (!userCan(user, moduleId, action)) {
    throw redirect({
      to: "/access-denied",
      search: { module: moduleId },
    });
  }
  return user;
}

export async function requirePathAccess(pathname: string) {
  const user = await requireAuthSession();
  const moduleId = pathToModuleId(pathname);
  if (!moduleId) return user;
  if (moduleId === "dashboard" && !userCan(user, "dashboard", "view")) {
    throw redirect({ to: firstAuthorizedPath(user) });
  }
  if (!userCan(user, moduleId, "view")) {
    throw redirect({
      to: "/access-denied",
      search: { module: moduleId },
    });
  }
  return user;
}
