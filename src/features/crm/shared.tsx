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
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  Search,
  Settings2,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

type CrmPath = "/" | "/leads" | "/customers" | "/deals" | "/invoices";

const navigation = [
  { label: "Dashboard", group: "WORKSPACE", to: "/" as CrmPath, icon: LayoutDashboard },
  { label: "Leads", group: "CRM", to: "/leads" as CrmPath, icon: ContactRound },
  { label: "Customers", group: "CRM", to: "/customers" as CrmPath, icon: UsersRound },
  { label: "Deals & Pipeline", group: "CRM", to: "/deals" as CrmPath, icon: BriefcaseBusiness },
  { label: "Invoices", group: "BUSINESS MANAGEMENT", to: "/invoices" as CrmPath, icon: ReceiptText },
];

function SidebarNavigation({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const currentPath = useRouterState({ select: (router) => router.location.pathname });
  const groups = [...new Set(navigation.map((item) => item.group))];

  return (
    <nav aria-label="Main navigation" className="space-y-5 px-2 py-5">
      {groups.map((group) => (
        <div key={group}>
          {!collapsed && <p className="px-2 pb-2 text-[10px] font-semibold text-muted-foreground">{group}</p>}
          <div className="space-y-1">
            {navigation.filter((item) => item.group === group).map((item) => {
              const active = currentPath === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[13px] transition-colors",
                    active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    collapsed && "justify-center px-0",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn("mt-auto border-t border-border p-3", collapsed && "px-2")}>
      <div className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-semibold text-foreground">JM</div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-xs font-medium">Jane Mitchell</p>
            <p className="truncate text-[10px] text-muted-foreground">Workspace owner</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link to="/" aria-label="Yaglob CRM dashboard" className={cn("flex h-14 items-center gap-2.5 border-b border-border px-4", collapsed && "justify-center px-2")}>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">Y</span>
      {!collapsed && (
        <span className="min-w-0 leading-tight">
          <span className="block text-sm font-semibold">Yaglob</span>
          <span className="block text-[10px] text-muted-foreground">CRM workspace</span>
        </span>
      )}
    </Link>
  );
}

function ProfileMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Open profile menu" className="h-9 gap-2 px-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-muted text-[10px] font-semibold">JM</span>
          <span className="hidden text-xs sm:inline">Jane Mitchell</span>
          <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Jane Mitchell</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => toast("Profile settings are a frontend preview.")}><Settings2 /> Account settings</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => toast("You are viewing a local frontend preview.")}><LogOut /> Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentPath = useRouterState({ select: (router) => router.location.pathname });
  const currentPage = navigation.find((item) => item.to === currentPath)?.label ?? "Dashboard";

  return (
    <div className="crm-shell flex min-h-screen w-full bg-muted/40 text-foreground">
      <aside className={cn("sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200 md:flex", collapsed ? "w-16" : "w-[180px]")}>
        <Brand collapsed={collapsed} />
        <div className="flex-1 overflow-y-auto">
          <SidebarNavigation collapsed={collapsed} />
        </div>
        <SidebarFooter collapsed={collapsed} />
      </aside>

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent className="fixed left-0 top-0 h-dvh w-[280px] max-w-[88vw] translate-x-0 translate-y-0 gap-0 rounded-none p-0 sm:max-w-[88vw]">
          <DialogTitle className="sr-only">Yaglob CRM navigation</DialogTitle>
          <div className="flex h-full flex-col bg-card">
            <Brand />
            <div className="flex-1 overflow-y-auto"><SidebarNavigation collapsed={false} onNavigate={() => setMobileOpen(false)} /></div>
            <SidebarFooter collapsed={false} />
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 grid h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-border bg-card/95 px-3 backdrop-blur sm:gap-4 sm:px-5">
          <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
            <Menu />
          </Button>
          <Button variant="ghost" size="icon" className="hidden h-8 w-8 md:inline-flex" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => setCollapsed((value) => !value)}>
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
          <div className="min-w-0">
            <p className="truncate text-xs text-muted-foreground"><span className="hidden sm:inline">Workspace&nbsp; / &nbsp;</span><span className="font-medium text-foreground">{currentPage}</span></p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <label className="relative hidden w-56 lg:block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input aria-label="Search your workspace" placeholder="Search anything…" className="h-8 border-transparent bg-muted/60 pl-8 text-xs shadow-none focus-visible:bg-background" />
            </label>
            <Button variant="ghost" size="icon" className="relative h-8 w-8" aria-label="Notifications" onClick={() => toast("You’re all caught up.")}>
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-success" />
            </Button>
            <ProfileMenu />
          </div>
        </header>
        <main className="min-w-0 flex-1 px-3 py-5 sm:px-5 sm:py-6 xl:px-7">
          <div className="mx-auto w-full max-w-[1560px]">{children}</div>
        </main>
      </div>
      <Toaster position="top-right" closeButton />
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:mb-6 sm:flex sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold sm:text-2xl">{title}</h1>
        <p className="mt-1 max-w-2xl text-xs text-muted-foreground sm:text-sm">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 items-center justify-end gap-2">{actions}</div>}
    </div>
  );
}

export function MetricCard({ icon, label, value, change, positive = true }: { icon: ReactNode; label: string; value: string; change: string; positive?: boolean }) {
  return (
    <article className="metric-card min-w-0 rounded-md border border-border bg-card p-2.5 shadow-sm sm:p-3">
      <div className="rounded-sm bg-muted/60 p-3">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-sm border border-border bg-card text-muted-foreground">{icon}</span>
          <p className="min-w-0 truncate text-[11px] font-medium text-muted-foreground sm:text-xs">{label}</p>
        </div>
        <p className="truncate text-xl font-semibold tabular-nums sm:text-2xl">{value}</p>
      </div>
      <div className="flex items-center justify-between gap-2 px-1 pt-2.5">
        <span className={cn("inline-flex min-w-0 items-center gap-1 truncate text-[10px] font-medium", positive ? "text-success" : "text-danger")}>
          {positive ? <ArrowUpRight className="h-3 w-3 shrink-0" /> : <ArrowDownRight className="h-3 w-3 shrink-0" />}
          {change}
        </span>
        <span className="shrink-0 text-[10px] text-muted-foreground">vs last month</span>
      </div>
    </article>
  );
}

export function MetricGrid({ children, columns = 4 }: { children: ReactNode; columns?: 4 | 5 }) {
  return <section className={cn("mb-5 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4", columns === 5 ? "xl:grid-cols-5" : "lg:grid-cols-4")}>{children}</section>;
}

export function Panel({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("min-w-0 rounded-md border border-border bg-card p-3 shadow-sm sm:p-4", className)}>
      <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
        <h2 className="truncate text-sm font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone = /paid|won|active|converted/i.test(status)
    ? "status-positive"
    : /overdue|lost|due/i.test(status)
      ? "status-negative"
      : /proposal|qualified|partial/i.test(status)
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
  const [visibleColumns, setVisibleColumns] = useState(() => new Set(columns.map((column) => column.id)));
  const searchableRows = rows.filter((row) => {
    const matchesQuery = query.trim().length === 0 || Object.values(row).some((value) => String(value).toLowerCase().includes(query.trim().toLowerCase()));
    const matchesStatus = status === "all" || !filterKey || String(row[filterKey]) === status;
    return matchesQuery && matchesStatus;
  });
  const pageSize = compact ? 5 : 7;
  const pageCount = Math.max(1, Math.ceil(searchableRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleRows = searchableRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const visible = columns.filter((column) => visibleColumns.has(column.id));
  const firstRow = searchableRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastRow = Math.min(currentPage * pageSize, searchableRows.length);

  return (
    <section className="min-w-0 overflow-hidden rounded-md border border-border bg-card shadow-sm">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-border p-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <label className="relative min-w-[170px] max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={searchPlaceholder} className="h-8 border-border pl-8 text-xs shadow-none" />
          </label>
          {filterOptions && filterKey && (
            <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}>
              <SelectTrigger aria-label="Filter by status" className="h-8 w-[132px] text-xs"><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {filterOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {toolbarRight}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" aria-label="Choose visible columns" className="h-8 gap-1.5 px-2.5 text-xs"><SlidersHorizontal className="h-3.5 w-3.5" /><span className="hidden sm:inline">Columns</span></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
              <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((column) => (
                <DropdownMenuCheckboxItem key={column.id} checked={visibleColumns.has(column.id)} onCheckedChange={(checked) => {
                  setVisibleColumns((current) => {
                    const next = new Set(current);
                    if (checked) next.add(column.id);
                    else next.delete(column.id);
                    return next;
                  });
                }}>{column.label}</DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-xs">
          <thead className="bg-muted/60 text-[10px] font-medium uppercase text-muted-foreground">
            <tr>{visible.map((column) => <th key={column.id} className={cn("whitespace-nowrap px-3 py-2.5 font-medium", column.className)}>{column.label}</th>)}</tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.id} className="border-t border-border/80 transition-colors hover:bg-muted/30">
                {visible.map((column) => <td key={column.id} className={cn("whitespace-nowrap px-3 py-2.5", column.className)}>{column.render(row)}</td>)}
              </tr>
            ))}
            {visibleRows.length === 0 && (
              <tr><td colSpan={Math.max(visible.length, 1)} className="px-3 py-12 text-center text-muted-foreground">No records match your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2.5 text-[10px] text-muted-foreground sm:text-xs">
        <span>Showing {firstRow}–{lastRow} of {searchableRows.length}</span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" aria-label="Previous page" className="h-7 w-7" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}><ChevronLeft /></Button>
          <span className="min-w-12 text-center">Page {currentPage} of {pageCount}</span>
          <Button variant="outline" size="icon" aria-label="Next page" className="h-7 w-7" disabled={currentPage >= pageCount} onClick={() => setPage((value) => Math.min(value + 1, pageCount))}><ChevronRight /></Button>
        </div>
      </div>
    </section>
  );
}

export function RowActions({ onView, onEdit, onDelete }: { onView?: () => void; onEdit?: () => void; onDelete?: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Row actions" className="h-7 w-7"><Ellipsis /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onView && <DropdownMenuItem onSelect={onView}>View details</DropdownMenuItem>}
        {onEdit && <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>}
        {onDelete && <DropdownMenuItem onSelect={onDelete} className="text-danger">Remove</DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function FormField({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return <label className={cn("grid min-w-0 gap-1.5 text-xs font-medium", className)}>{label}{children}</label>;
}

export function currency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export function ImportExportActions({ includeImport = true }: { includeImport?: boolean }) {
  return (
    <div className="hidden items-center gap-2 sm:flex">
      {includeImport && <Button variant="outline" size="sm" className="h-8" onClick={() => toast("Import is ready for connected records.")}><CreditCard className="h-3.5 w-3.5" />Import</Button>}
      <Button variant="outline" size="sm" className="h-8" onClick={() => toast("Your current view is ready to export.")}><ArrowUpRight className="h-3.5 w-3.5" />Export</Button>
    </div>
  );
}