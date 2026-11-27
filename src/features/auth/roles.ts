import { allModulePermissions, permissionsFromModules } from "./permissions";
import type { ModulePermission, RoleId } from "./types";

export type RoleTemplate = {
  id: RoleId;
  label: string;
  description: string;
  protected?: boolean;
  defaultPermissions: ModulePermission[];
};

export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    id: "super-admin",
    label: "Super Admin",
    description: "Full access to all modules, users, and development status.",
    protected: true,
    defaultPermissions: allModulePermissions(),
  },
  {
    id: "ceo",
    label: "CEO",
    description: "Business overview across sales, finance, and inventory.",
    defaultPermissions: permissionsFromModules([
      "dashboard",
      "leads",
      "customers",
      "deals",
      "invoices",
      "payments",
      "reports",
      "inventory",
    ]),
  },
  {
    id: "manager",
    label: "Manager",
    description: "CRM and sales operations with reporting.",
    defaultPermissions: permissionsFromModules([
      "dashboard",
      "leads",
      "customers",
      "deals",
      "products",
      "quotations",
      "invoices",
      "reports",
    ]),
  },
  {
    id: "employee",
    label: "Employee",
    description: "Core CRM and quotations.",
    defaultPermissions: permissionsFromModules([
      "dashboard",
      "leads",
      "customers",
      "quotations",
    ]),
  },
  {
    id: "seo-executive",
    label: "SEO Executive",
    description: "Lead and customer visibility for marketing.",
    defaultPermissions: permissionsFromModules([
      "dashboard",
      "leads",
      "customers",
    ]),
  },
  {
    id: "sales-executive",
    label: "Sales Executive",
    description: "Pipeline, catalog, and quotations.",
    defaultPermissions: permissionsFromModules([
      "dashboard",
      "leads",
      "customers",
      "deals",
      "products",
      "quotations",
    ]),
  },
  {
    id: "accountant",
    label: "Accountant",
    description: "Invoices, payments, and reports.",
    defaultPermissions: permissionsFromModules([
      "dashboard",
      "invoices",
      "payments",
      "reports",
    ]),
  },
  {
    id: "purchase-manager",
    label: "Purchase Manager",
    description: "Vendors, POs, receiving, and inventory.",
    defaultPermissions: permissionsFromModules([
      "dashboard",
      "products",
      "vendors",
      "purchase-orders",
      "goods-receiving",
      "inventory",
    ]),
  },
  {
    id: "inventory-manager",
    label: "Inventory Manager",
    description: "Products, stock, and goods receiving.",
    defaultPermissions: permissionsFromModules([
      "dashboard",
      "products",
      "inventory",
      "goods-receiving",
    ]),
  },
  {
    id: "custom",
    label: "Custom Role",
    description: "Administrator-defined module and action permissions.",
    defaultPermissions: [],
  },
];

export function getRoleTemplate(roleId: RoleId) {
  return ROLE_TEMPLATES.find((role) => role.id === roleId);
}

export function defaultPermissionsForRole(roleId: RoleId): ModulePermission[] {
  const template = getRoleTemplate(roleId);
  return template
    ? template.defaultPermissions.map((entry) => ({
        moduleId: entry.moduleId,
        actions: [...entry.actions],
      }))
    : [];
}
