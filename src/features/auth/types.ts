export type ModuleId =
  | "dashboard"
  | "leads"
  | "customers"
  | "deals"
  | "products"
  | "quotations"
  | "invoices"
  | "payments"
  | "vendors"
  | "purchase-orders"
  | "goods-receiving"
  | "inventory"
  | "reports"
  | "settings"
  | "admin-access"
  | "development-status"
  | "notifications";

export type ActionId =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "import"
  | "export"
  | "approve"
  | "issue-invoice"
  | "record-payment"
  | "receive-goods"
  | "print"
  | "download";

export type RoleId =
  | "super-admin"
  | "ceo"
  | "manager"
  | "employee"
  | "seo-executive"
  | "sales-executive"
  | "accountant"
  | "purchase-manager"
  | "inventory-manager"
  | "custom";

export type AccountStatus = "Active" | "Inactive";

export type ModulePermission = {
  moduleId: ModuleId;
  actions: ActionId[];
};

export type PasswordRecord = {
  algo: "PBKDF2-SHA-256";
  iterations: number;
  salt: string;
  hash: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  designation: string;
  roleId: RoleId;
  status: AccountStatus;
  permissions: ModulePermission[];
  password: PasswordRecord;
  createdAt: string;
  lastLoginAt?: string;
};

export type AuthSession = {
  userId: string;
  email: string;
  startedAt: string;
};

export type AuthStoreState = {
  version: number;
  users: AuthUser[];
};
