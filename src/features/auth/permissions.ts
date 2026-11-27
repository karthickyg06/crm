import type { ActionId, ModuleId, ModulePermission } from "./types";

export type ModuleDefinition = {
  id: ModuleId;
  label: string;
  path: string;
  actions: ActionId[];
  nav?: boolean;
};

export const MODULE_REGISTRY: ModuleDefinition[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/",
    actions: ["view"],
    nav: true,
  },
  {
    id: "leads",
    label: "Leads",
    path: "/leads",
    actions: ["view", "create", "edit", "delete", "import", "export"],
    nav: true,
  },
  {
    id: "customers",
    label: "Customers",
    path: "/customers",
    actions: ["view", "create", "edit", "delete", "import", "export"],
    nav: true,
  },
  {
    id: "deals",
    label: "Deals & Pipeline",
    path: "/deals",
    actions: ["view", "create", "edit", "delete"],
    nav: true,
  },
  {
    id: "products",
    label: "Products",
    path: "/products",
    actions: ["view", "create", "edit", "delete", "import", "export"],
    nav: true,
  },
  {
    id: "quotations",
    label: "Quotations",
    path: "/quotations",
    actions: ["view", "create", "edit", "delete", "print", "download"],
    nav: true,
  },
  {
    id: "invoices",
    label: "Invoices",
    path: "/invoices",
    actions: [
      "view",
      "create",
      "edit",
      "delete",
      "issue-invoice",
      "print",
      "download",
      "record-payment",
    ],
    nav: true,
  },
  {
    id: "payments",
    label: "Payments",
    path: "/payments",
    actions: ["view", "record-payment", "print", "download"],
    nav: true,
  },
  {
    id: "vendors",
    label: "Vendors",
    path: "/vendors",
    actions: ["view", "create", "edit", "delete", "import", "export"],
    nav: true,
  },
  {
    id: "purchase-orders",
    label: "Purchase Orders",
    path: "/purchase-orders",
    actions: ["view", "create", "edit", "delete", "approve"],
    nav: true,
  },
  {
    id: "goods-receiving",
    label: "Goods Receiving",
    path: "/goods-receiving",
    actions: ["view", "receive-goods"],
    nav: true,
  },
  {
    id: "inventory",
    label: "Inventory",
    path: "/inventory",
    actions: ["view", "export"],
    nav: true,
  },
  {
    id: "reports",
    label: "Reports",
    path: "/reports",
    actions: ["view", "export"],
    nav: true,
  },
  {
    id: "settings",
    label: "Settings",
    path: "/settings",
    actions: ["view", "edit"],
    nav: true,
  },
  {
    id: "admin-access",
    label: "Admin Access",
    path: "/settings/admin-access",
    actions: ["view", "create", "edit", "delete"],
    nav: false,
  },
  {
    id: "development-status",
    label: "Development Status",
    path: "/settings/development-status",
    actions: ["view", "edit"],
    nav: false,
  },
  {
    id: "notifications",
    label: "Notification Center",
    path: "/settings/notifications",
    actions: ["view"],
    nav: false,
  },
];

export function getModuleDefinition(moduleId: ModuleId) {
  return MODULE_REGISTRY.find((entry) => entry.id === moduleId);
}

export function pathToModuleId(pathname: string): ModuleId | null {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  if (normalized === "/settings/admin-access") return "admin-access";
  if (normalized === "/settings/development-status")
    return "development-status";
  if (normalized === "/settings/notifications") return "notifications";
  if (normalized === "/settings" || normalized.startsWith("/settings/")) {
    return "settings";
  }
  const hit = MODULE_REGISTRY.find((entry) => entry.path === normalized);
  return hit?.id ?? null;
}

export function ensureViewAction(actions: ActionId[]): ActionId[] {
  const unique = new Set(actions);
  if (unique.size > 0) unique.add("view");
  return [...unique];
}

export function normalizePermissions(
  permissions: ModulePermission[],
): ModulePermission[] {
  return permissions
    .map((entry) => {
      const def = getModuleDefinition(entry.moduleId);
      if (!def) return null;
      const allowed = new Set(def.actions);
      const actions = ensureViewAction(
        entry.actions.filter((action) => allowed.has(action)),
      );
      if (actions.length === 0) return null;
      return { moduleId: entry.moduleId, actions };
    })
    .filter((entry): entry is ModulePermission => Boolean(entry));
}

export function hasModulePermission(
  permissions: ModulePermission[],
  moduleId: ModuleId,
  action: ActionId = "view",
) {
  const entry = permissions.find((item) => item.moduleId === moduleId);
  if (!entry) return false;
  if (action === "view") return entry.actions.includes("view");
  return entry.actions.includes("view") && entry.actions.includes(action);
}

export function allModulePermissions(): ModulePermission[] {
  return MODULE_REGISTRY.map((module) => ({
    moduleId: module.id,
    actions: [...module.actions],
  }));
}

export function permissionsFromModules(
  moduleIds: ModuleId[],
): ModulePermission[] {
  return MODULE_REGISTRY.filter((module) => moduleIds.includes(module.id)).map(
    (module) => ({
      moduleId: module.id,
      actions: [...module.actions],
    }),
  );
}
