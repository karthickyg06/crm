import type { ActionId, ModuleId } from "@/features/auth/types";

/** Flat primary navigation — order is intentional for demo/ERP flow. */
export const PRIMARY_NAVIGATION = [
  { label: "Dashboard", to: "/" },
  { label: "Leads", to: "/leads" },
  { label: "Customers", to: "/customers" },
  { label: "Deals & Pipeline", to: "/deals" },
  { label: "Products", to: "/products" },
  { label: "Quotations", to: "/quotations" },
  { label: "Invoices", to: "/invoices" },
  { label: "Payments", to: "/payments" },
  { label: "Vendors", to: "/vendors" },
  { label: "Purchase Orders", to: "/purchase-orders" },
  { label: "Goods Receiving", to: "/goods-receiving" },
  { label: "Inventory", to: "/inventory" },
  { label: "Reports", to: "/reports" },
] as const;

export type PrimaryNavPath = (typeof PRIMARY_NAVIGATION)[number]["to"];

const settingsSubpageLabels: Record<string, string> = {
  "/settings": "Settings",
  "/settings/admin-access": "Admin Access",
  "/settings/development-status": "Development Status",
  "/settings/notifications": "Notification Center",
};

/** Sidebar primary destinations — excludes Admin Access / Dev Status. */
export function getSidebarPrimaryPaths() {
  return PRIMARY_NAVIGATION.map((item) => item.to);
}

/** Profile dropdown admin links — driven by existing permission checks. */
export function getProfileMenuVisibility(
  can: (moduleId: ModuleId, action?: ActionId) => boolean,
) {
  return {
    showProfile: can("settings", "view"),
    showAdminAccess: can("admin-access", "view"),
    showDevelopmentStatus: can("development-status", "view"),
    showNotifications: can("notifications", "view"),
  };
}

export function resolveHeaderPageLabel(pathname: string) {
  if (settingsSubpageLabels[pathname]) return settingsSubpageLabels[pathname];
  return (
    PRIMARY_NAVIGATION.find((item) => item.to === pathname)?.label ??
    "Dashboard"
  );
}
