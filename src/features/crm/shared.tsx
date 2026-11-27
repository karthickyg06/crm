import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ContactRound,
  CreditCard,
  Ellipsis,
  Boxes,
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LineChart,
  ListTodo,
  LogOut,
  Menu,
  Package,
  PackageCheck,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  UserRound,
  UsersRound,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/features/auth/useAuth";
import { logout } from "@/features/auth/authStore";
import { getRoleTemplate } from "@/features/auth/roles";
import { ACTION_ICONS, RowActionsBar } from "@/features/crm/actionControls";
import {
  getProfileMenuVisibility,
  PRIMARY_NAVIGATION,
  resolveHeaderPageLabel,
} from "@/features/crm/navigation";
import { NotificationBell } from "@/features/notifications/NotificationBell";
import { cn } from "@/lib/utils";

export {
  ACTION_ICONS,
  ActionIconButton,
  ConfirmActionDialog,
  formatCompactDate,
  RowActionsBar,
  RowActionsMenu,
  TABLE_ACTION_CELL_CLASS,
  TABLE_CELL_CLASS,
  TABLE_HEAD_CLASS,
  TABLE_ROW_CLASS,
  TruncateWithTooltip,
  useConfirmAction,
} from "@/features/crm/actionControls";

type CrmPath =
  | "/"
  | "/leads"
  | "/customers"
  | "/deals"
  | "/invoices"
  | "/payments"
  | "/products"
  | "/quotations"
  | "/inventory"
  | "/vendors"
  | "/purchase-orders"
  | "/goods-receiving"
  | "/reports"
  | "/settings"
  | "/settings/admin-access"
  | "/settings/development-status"
  | "/login"
  | "/access-denied";

type NavItem = {
  label: string;
  to: CrmPath;
  icon: typeof LayoutDashboard;
};

const navIcons: Record<
  (typeof PRIMARY_NAVIGATION)[number]["to"],
  typeof LayoutDashboard
> = {
  "/": LayoutDashboard,
  "/leads": ContactRound,
  "/customers": UsersRound,
  "/deals": BriefcaseBusiness,
  "/products": Package,
  "/quotations": FileText,
  "/invoices": ReceiptText,
  "/payments": CreditCard,
  "/vendors": Building2,
  "/purchase-orders": ClipboardList,
  "/goods-receiving": PackageCheck,
  "/inventory": Boxes,
  "/reports": LineChart,
};

/** Flat primary navigation — order is intentional for demo/ERP flow. */
const primaryNavigation: NavItem[] = PRIMARY_NAVIGATION.map((item) => ({
  ...item,
  icon: navIcons[item.to],
}));

const settingsNav: NavItem = {
  label: "Settings",
  to: "/settings",
  icon: Settings2,
};

/**
 * Future ERP modules for a side flyout. Only `enabled: true` items render.
 * Do not enable until a working route/component exists.
 */
const moreModulesCatalog: Array<{
  id: string;
  label: string;
  enabled: boolean;
  to?: CrmPath;
  icon: typeof LayoutDashboard;
}> = [
  { id: "expenses", label: "Expenses", enabled: false, icon: Wallet },
  {
    id: "purchase-bills",
    label: "Purchase Bills",
    enabled: false,
    icon: ClipboardList,
  },
  { id: "pos", label: "POS", enabled: false, icon: ShoppingBag },
  { id: "credit-notes", label: "Credit Notes", enabled: false, icon: FileText },
  { id: "tasks", label: "Tasks", enabled: false, icon: ListTodo },
  {
    id: "accounting",
    label: "Accounting",
    enabled: false,
    icon: LineChart,
  },
  {
    id: "users-roles",
    label: "Users & Roles",
    enabled: false,
    icon: UsersRound,
  },
];

const navigation = [...primaryNavigation, settingsNav];

function NavLinkItem({
  item,
  collapsed,
  active,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium transition-colors",
        active
          ? "bg-[#EAF0FF] text-[#2F6BFF]"
          : "text-muted-foreground hover:bg-[#F3F4F6] hover:text-foreground",
        collapsed && "justify-center px-0",
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-[#2F6BFF]" />
      )}
      <item.icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

function MoreModulesFlyout({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const enabled = moreModulesCatalog.filter((item) => item.enabled && item.to);
  if (enabled.length === 0) return null;

  return (
    <div className="relative mt-0.5">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        title={collapsed ? "More modules" : undefined}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-[#F3F4F6] hover:text-foreground",
          collapsed && "justify-center px-0",
          open && "bg-[#F3F4F6] text-foreground",
        )}
      >
        <Ellipsis className="h-4 w-4 shrink-0" />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 truncate text-left">
              More modules
            </span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-70" />
          </>
        )}
      </button>
      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute top-0 z-40 min-w-[180px] rounded-md border border-border bg-card p-1.5 shadow-sm",
            collapsed ? "left-full ml-2" : "left-full ml-2",
          )}
        >
          {enabled.map((item) => (
            <Link
              key={item.id}
              to={item.to!}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
              className="flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-[#F3F4F6] hover:text-foreground"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function pathModule(path: string) {
  if (path === "/") return "dashboard" as const;
  if (path === "/settings") return "settings" as const;
  if (path === "/settings/admin-access") return "admin-access" as const;
  if (path === "/settings/development-status") {
    return "development-status" as const;
  }
  if (path === "/purchase-orders") return "purchase-orders" as const;
  if (path === "/goods-receiving") return "goods-receiving" as const;
  return path.replace(/^\//, "") as
    | "leads"
    | "customers"
    | "deals"
    | "products"
    | "quotations"
    | "invoices"
    | "payments"
    | "vendors"
    | "inventory"
    | "reports";
}

function SidebarNavigation({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { can } = useAuth();
  const currentPath = useRouterState({
    select: (router) => router.location.pathname,
  });
  const visible = primaryNavigation.filter((item) =>
    can(pathModule(item.to), "view"),
  );

  return (
    <nav aria-label="Main navigation" className="px-2 py-2">
      <div className="flex flex-col gap-0.5">
        {visible.map((item) => (
          <NavLinkItem
            key={item.to}
            item={item}
            collapsed={collapsed}
            active={currentPath === item.to}
            {...(onNavigate ? { onNavigate } : {})}
          />
        ))}
        <MoreModulesFlyout
          collapsed={collapsed}
          {...(onNavigate ? { onNavigate } : {})}
        />
      </div>
    </nav>
  );
}

function SidebarFooter({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { user, can } = useAuth();
  const currentPath = useRouterState({
    select: (router) => router.location.pathname,
  });
  const showSettings = can("settings", "view");
  const roleLabel =
    getRoleTemplate(user?.roleId ?? "employee")?.label ?? "User";
  const userInitials = (user?.name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className={cn(
        "mt-auto border-t border-border/70 px-2 py-2",
        collapsed && "px-1.5",
      )}
    >
      {showSettings ? (
        <NavLinkItem
          item={settingsNav}
          collapsed={collapsed}
          active={currentPath === settingsNav.to}
          {...(onNavigate ? { onNavigate } : {})}
        />
      ) : null}
      <div
        className={cn(
          "mt-1.5 flex items-center gap-2.5 px-1.5 pt-1.5",
          collapsed && "justify-center px-0",
        )}
      >
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#EAF0FF] text-[10px] font-semibold text-[#2F6BFF]">
          {userInitials || "U"}
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-xs font-medium">
              {user?.name ?? "Signed out"}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">
              {roleLabel}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      to="/"
      aria-label="Yaglob CRM dashboard"
      className={cn(
        "flex h-12 shrink-0 items-center gap-2.5 border-b border-border/70 px-3",
        collapsed && "justify-center px-2",
      )}
    >
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[#2F6BFF] text-xs font-bold text-white">
        Y
      </span>
      {!collapsed && (
        <span className="min-w-0 leading-tight">
          <span className="block text-sm font-bold tracking-tight">
            Yaglob CRM
          </span>
        </span>
      )}
    </Link>
  );
}

function ProfileMenu() {
  const { user, can } = useAuth();
  const {
    showProfile,
    showAdminAccess,
    showDevelopmentStatus,
    showNotifications,
  } = getProfileMenuVisibility(can);
  const roleLabel =
    getRoleTemplate(user?.roleId ?? "employee")?.label ?? "User";
  const userInitials = (user?.name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Open profile menu"
          className="h-9 gap-2 px-2"
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-muted text-[10px] font-semibold">
            {userInitials || "U"}
          </span>
          <span className="hidden text-xs sm:inline">
            {user?.name ?? "Account"}
          </span>
          <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 rounded-xl border border-border/80 bg-card p-1.5 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.45)]"
      >
        <DropdownMenuLabel className="px-2.5 py-2">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-foreground">
              {user?.name ?? "Account"}
            </p>
            <p className="text-[11px] font-normal text-muted-foreground">
              {user?.email}
            </p>
            <p className="text-[11px] font-normal text-muted-foreground">
              {roleLabel}
              {user?.status ? ` · ${user.status}` : ""}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {showProfile ? (
          <DropdownMenuItem asChild className="rounded-lg">
            <Link to="/settings">
              <UserRound className="h-4 w-4" /> My Profile
            </Link>
          </DropdownMenuItem>
        ) : null}
        {showAdminAccess ? (
          <DropdownMenuItem asChild className="rounded-lg">
            <Link to="/settings/admin-access">
              <ShieldCheck className="h-4 w-4" /> Admin Access
            </Link>
          </DropdownMenuItem>
        ) : null}
        {showDevelopmentStatus ? (
          <DropdownMenuItem asChild className="rounded-lg">
            <Link to="/settings/development-status">
              <ClipboardList className="h-4 w-4" /> Development Status
            </Link>
          </DropdownMenuItem>
        ) : null}
        {showNotifications ? (
          <DropdownMenuItem asChild className="rounded-lg">
            <Link to="/settings/notifications">
              <Bell className="h-4 w-4" /> Notification Center
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="rounded-lg"
          onSelect={() => {
            logout();
            toast.info("Signed out of the demo session.");
            window.location.assign("/login");
          }}
        >
          <LogOut className="h-4 w-4" /> Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentPath = useRouterState({
    select: (router) => router.location.pathname,
  });
  const currentPage = resolveHeaderPageLabel(currentPath);

  return (
    <div className="crm-shell flex min-h-screen w-full bg-background text-foreground">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border/70 bg-card transition-[width] duration-200 md:flex",
          collapsed ? "w-[64px]" : "w-[220px]",
        )}
      >
        <Brand collapsed={collapsed} />
        <div className="crm-sidebar-scroll min-h-0 flex-1 overflow-y-auto">
          <SidebarNavigation collapsed={collapsed} />
        </div>
        <SidebarFooter collapsed={collapsed} />
      </aside>

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent className="fixed left-0 top-0 h-dvh w-[240px] max-w-[88vw] translate-x-0 translate-y-0 gap-0 rounded-none p-0 sm:max-w-[88vw]">
          <DialogTitle className="sr-only">Yaglob CRM navigation</DialogTitle>
          <div className="flex h-full flex-col bg-card">
            <Brand />
            <div className="crm-sidebar-scroll min-h-0 flex-1 overflow-y-auto">
              <SidebarNavigation
                collapsed={false}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
            <SidebarFooter
              collapsed={false}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/70 bg-card/90 px-3 backdrop-blur sm:gap-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl md:hidden"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <Menu />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden h-9 w-9 rounded-xl md:inline-flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
          <p className="shrink-0 text-base font-semibold tracking-tight text-foreground">
            {currentPage === "Dashboard" ? "Overview" : currentPage}
          </p>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
            <label className="relative hidden w-full max-w-md lg:block">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search your workspace"
                placeholder="Search…"
                className="h-10 rounded-full border-[#E5EAF2] bg-[#F7F9FC] pl-10 text-sm shadow-none"
              />
            </label>
            <NotificationBell />
            <ProfileMenu />
          </div>
        </header>
        <main className="min-w-0 flex-1 px-3 py-5 sm:px-6 sm:py-6 xl:px-8">
          <div className="mx-auto w-full max-w-[1560px]">{children}</div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:mb-6">
      <div className="min-w-0">
        <h1 className="truncate text-[26px] font-bold tracking-tight text-foreground sm:text-[28px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center justify-end gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

/** Medium-strength premium chart series shared across CRM analytics. */
export const SOFT_CHART_COLORS = [
  "#5685DD",
  "#449EA8",
  "#9271D0",
  "#43A980",
  "#DF9B60",
  "#D47C96",
] as const;

export const SOFT_CHART_TRACKS = {
  blue: "#E8EEF8",
  teal: "#E6F3F4",
  lavender: "#F0EAF8",
  green: "#E7F5EF",
  peach: "#F8EEE4",
  rose: "#F7EAEF",
  grey: "#F1F5F9",
  well: "#F8FAFC",
  grid: "#E8EEF3",
} as const;

export function softChartColor(index: number) {
  return SOFT_CHART_COLORS[index % SOFT_CHART_COLORS.length]!;
}

export function ChartLegend({
  items,
}: {
  items: Array<{ label: string; color: string }>;
}) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <li
          key={item.label}
          className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"
        >
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: item.color }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export function MetricCard({
  icon,
  label,
  value,
  change,
  positive = true,
  interactive = false,
  className,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  change?: string | undefined;
  positive?: boolean;
  interactive?: boolean;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "metric-card metric-card--kpi",
        interactive && "metric-card--interactive",
        className,
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-medium text-slate-600">
          {label}
        </p>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#EAF0FF] text-[#2F6BFF]">
          {icon}
        </span>
      </div>
      <p
        className="metric-card__value text-[22px] font-bold leading-tight tracking-tight text-slate-800 sm:text-[26px] lg:text-[28px]"
        title={value}
      >
        {value}
      </p>
      <div className="metric-card__change gap-2">
        {change ? (
          <>
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-semibold",
                positive ? "text-success" : "text-danger",
              )}
            >
              {positive ? (
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 shrink-0" />
              )}
              {positive ? `+ ${change}` : change}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Last Month
            </span>
          </>
        ) : (
          <span className="invisible text-[11px]" aria-hidden>
            —
          </span>
        )}
      </div>
    </article>
  );
}

export function SummaryCard({
  children,
  className,
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <article
      className={cn(
        "summary-card",
        interactive && "summary-card--interactive",
        className,
      )}
    >
      {children}
    </article>
  );
}

export function CardSkeleton({
  variant = "kpi",
  className,
}: {
  variant?: "kpi" | "summary" | "panel";
  className?: string;
}) {
  return (
    <div
      className={cn(
        variant === "panel" && "crm-card min-h-40 p-5",
        variant === "kpi" && "metric-card metric-card--kpi",
        variant === "summary" && "summary-card",
        className,
      )}
      aria-hidden
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="h-4 w-24 animate-pulse rounded bg-primary/10" />
        <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-primary/10" />
      </div>
      <div className="h-7 w-32 animate-pulse rounded bg-primary/10" />
      {variant !== "panel" ? (
        <div className="metric-card__change">
          <div className="h-3 w-20 animate-pulse rounded bg-primary/10" />
        </div>
      ) : null}
    </div>
  );
}

export function MetricGrid({
  children,
  columns = 4,
}: {
  children: ReactNode;
  columns?: 4 | 5;
}) {
  return (
    <section
      className={cn(
        "metric-grid mb-5 grid grid-cols-2 sm:mb-6",
        columns === 5 ? "xl:grid-cols-5" : "lg:grid-cols-4",
      )}
    >
      {children}
    </section>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("crm-card min-w-0 p-[var(--card-pad-panel)]", className)}
    >
      <div className="mb-5 flex min-w-0 items-center justify-between gap-3">
        <h2 className="truncate text-[15px] font-bold tracking-tight text-foreground">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone =
    normalized === "new"
      ? "status-new"
      : normalized === "contacted"
        ? "status-contacted"
        : normalized === "qualified"
          ? "status-qualified"
          : /proposal/i.test(status)
            ? "status-proposal"
            : /paid|won|active|converted|completed/i.test(status)
              ? "status-positive"
              : /overdue|lost|due|blocked/i.test(status)
                ? "status-negative"
                : /partial|pending|inactive/i.test(status)
                  ? "status-notice"
                  : "status-neutral";
  return <span className={cn("status-badge", tone)}>{status}</span>;
}

export type DataColumn<T> = {
  id: string;
  label: string;
  render: (row: T) => ReactNode;
  className?: string;
};

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  filterKey,
  filterOptions,
  searchPlaceholder = "Search records…",
  toolbarRight,
  compact = false,
}: {
  rows: T[];
  columns: DataColumn<T>[];
  filterKey?: keyof T;
  filterOptions?: string[];
  searchPlaceholder?: string;
  toolbarRight?: ReactNode;
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState(
    () => new Set(columns.map((column) => column.id)),
  );
  const searchableRows = rows.filter((row) => {
    const matchesQuery =
      query.trim().length === 0 ||
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(query.trim().toLowerCase()),
      );
    const matchesStatus =
      status === "all" || !filterKey || String(row[filterKey]) === status;
    return matchesQuery && matchesStatus;
  });
  const pageSize = compact ? 5 : 7;
  const pageCount = Math.max(1, Math.ceil(searchableRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleRows = searchableRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const visible = columns.filter((column) => visibleColumns.has(column.id));
  const firstRow =
    searchableRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastRow = Math.min(currentPage * pageSize, searchableRows.length);

  return (
    <section className="crm-card min-w-0">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-border/80 px-3 py-3 sm:px-4">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <label className="relative min-w-[170px] max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder={searchPlaceholder}
              className="h-9 rounded-xl border-border pl-9 text-sm shadow-none"
            />
          </label>
          {filterOptions && filterKey && (
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
            >
              <SelectTrigger
                aria-label="Filter by status"
                className="h-8 w-[132px] text-xs"
              >
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {filterOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {toolbarRight}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                aria-label="Choose visible columns"
                className="h-8 gap-1.5 px-2.5 text-xs"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Columns</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="max-h-80 overflow-y-auto"
            >
              <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={visibleColumns.has(column.id)}
                  onCheckedChange={(checked) => {
                    setVisibleColumns((current) => {
                      const next = new Set(current);
                      if (checked) next.add(column.id);
                      else next.delete(column.id);
                      return next;
                    });
                  }}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground">
            <tr>
              {visible.map((column) => (
                <th
                  key={column.id}
                  className={cn(
                    "whitespace-nowrap px-3 py-2.5 font-semibold",
                    column.className,
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr
                key={row.id}
                className="border-t border-border/70 transition-colors hover:bg-muted/40"
              >
                {visible.map((column) => (
                  <td
                    key={column.id}
                    className={cn(
                      "whitespace-nowrap px-3 py-2.5 align-middle",
                      column.className,
                    )}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
            {visibleRows.length === 0 && (
              <tr>
                <td
                  colSpan={Math.max(visible.length, 1)}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  No records match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2.5 text-[10px] text-muted-foreground sm:text-xs">
        <span>
          Showing {firstRow}–{lastRow} of {searchableRows.length}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous page"
            className="h-7 w-7"
            disabled={currentPage <= 1}
            onClick={() => setPage((value) => Math.max(value - 1, 1))}
          >
            <ChevronLeft />
          </Button>
          <span className="min-w-12 text-center">
            Page {currentPage} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next page"
            className="h-7 w-7"
            disabled={currentPage >= pageCount}
            onClick={() => setPage((value) => Math.min(value + 1, pageCount))}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </section>
  );
}

export function RowActions({
  onView,
  onEdit,
  onDelete,
}: {
  onView?: (() => void) | undefined;
  onEdit?: (() => void) | undefined;
  onDelete?: (() => void) | undefined;
}) {
  const primary = [
    onView
      ? {
          id: "view",
          label: "View details",
          icon: ACTION_ICONS.view,
          onClick: onView,
        }
      : null,
    onEdit
      ? {
          id: "edit",
          label: "Edit",
          icon: ACTION_ICONS.edit,
          onClick: onEdit,
        }
      : null,
  ].filter(Boolean) as Array<{
    id: string;
    label: string;
    icon: typeof ACTION_ICONS.view;
    onClick: () => void;
  }>;

  const menuItems = onDelete
    ? [
        {
          id: "delete",
          label: "Delete",
          icon: ACTION_ICONS.delete,
          onSelect: onDelete,
          tone: "danger" as const,
        },
      ]
    : [];

  return <RowActionsBar primary={primary} menuItems={menuItems} />;
}

export function FormField({
  label,
  children,
  className,
  required = false,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <label
      className={cn("grid min-w-0 gap-1.5 text-xs font-medium", className)}
    >
      <span>
        {label}
        {required ? (
          <span className="ml-0.5 text-danger" aria-hidden="true">
            *
          </span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

export function currency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/** @deprecated Use ImportExportToolbar from @/features/crm/importExport */
export function ImportExportActions({
  includeImport = true,
}: {
  includeImport?: boolean;
}) {
  void includeImport;
  return null;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
