import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  CircleX,
  Mail,
  MessageCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/features/auth/useAuth";
import {
  ACTION_ICONS,
  AppShell,
  MetricCard,
  MetricGrid,
  PageHeader,
  RowActionsBar,
  TABLE_ACTION_CELL_CLASS,
  TABLE_CELL_CLASS,
  TABLE_HEAD_CLASS,
  TABLE_ROW_CLASS,
  TruncateWithTooltip,
  formatCompactDate,
} from "@/features/crm/shared";
import { cn } from "@/lib/utils";

import {
  isNotificationUnread,
  listVisibleNotifications,
  markNotificationRead,
  markNotificationsRead,
  relativeTime,
  subscribeNotifications,
} from "./notificationStore";
import type {
  AppNotification,
  NotificationModule,
  NotificationSeverity,
} from "./types";

const MODULE_FILTERS: Array<{ id: string; label: string }> = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "leads", label: "Leads" },
  { id: "customers", label: "Customers" },
  { id: "deals", label: "Deals" },
  { id: "products", label: "Products" },
  { id: "quotations", label: "Quotations" },
  { id: "invoices", label: "Invoices" },
  { id: "payments", label: "Payments" },
  { id: "vendors", label: "Vendors" },
  { id: "purchase-orders", label: "Purchase Orders" },
  { id: "goods-receiving", label: "Goods Receiving" },
  { id: "inventory", label: "Inventory" },
  { id: "email", label: "Email" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "admin-access", label: "Admin Access" },
  { id: "system", label: "System" },
];

const SEVERITY_STYLE: Record<NotificationSeverity, string> = {
  success: "bg-emerald-100 text-emerald-800",
  error: "bg-red-100 text-red-800",
  warning: "bg-amber-100 text-amber-800",
  info: "bg-sky-100 text-sky-800",
};

export function NotificationCenterPage() {
  const { user, can } = useAuth();
  const navigate = useNavigate();
  const canViewOrg = can("notifications", "view");
  const [items, setItems] = useState<AppNotification[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [delivery, setDelivery] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [viewing, setViewing] = useState<AppNotification | null>(null);

  useEffect(() => {
    const refresh = () => {
      if (!user) {
        setItems([]);
        return;
      }
      setItems(
        listVisibleNotifications({
          userId: user.id,
          canViewOrg,
        }),
      );
    };
    refresh();
    return subscribeNotifications(refresh);
  }, [user, canViewOrg]);

  const refresh = () => {
    if (!user) {
      setItems([]);
      return;
    }
    setItems(
      listVisibleNotifications({
        userId: user.id,
        canViewOrg,
      }),
    );
  };

  const filtered = useMemo(() => {
    if (!user) return [];
    const now = Date.now();
    return items.filter((item) => {
      const haystack =
        `${item.title} ${item.description} ${item.module} ${item.eventType}`.toLowerCase();
      if (query.trim() && !haystack.includes(query.trim().toLowerCase())) {
        return false;
      }
      if (category === "unread" && !isNotificationUnread(item, user.id)) {
        return false;
      }
      if (
        category !== "all" &&
        category !== "unread" &&
        item.module !== category &&
        item.channel !== category
      ) {
        return false;
      }
      if (severity !== "all" && item.severity !== severity) return false;
      if (delivery !== "all" && item.deliveryStatus !== delivery) return false;
      if (dateRange !== "all") {
        const created = Date.parse(item.createdAt);
        if (Number.isNaN(created)) return false;
        const dayMs = 24 * 60 * 60 * 1000;
        if (dateRange === "24h" && now - created > dayMs) return false;
        if (dateRange === "7d" && now - created > 7 * dayMs) return false;
        if (dateRange === "30d" && now - created > 30 * dayMs) return false;
      }
      return true;
    });
  }, [items, user, query, category, severity, delivery, dateRange]);

  const stats = useMemo(() => {
    if (!user) {
      return { total: 0, unread: 0, succeeded: 0, failed: 0, warnings: 0 };
    }
    return {
      total: items.length,
      unread: items.filter((item) => isNotificationUnread(item, user.id))
        .length,
      succeeded: items.filter((item) => item.operationStatus === "succeeded")
        .length,
      failed: items.filter((item) => item.operationStatus === "failed").length,
      warnings: items.filter(
        (item) =>
          item.operationStatus === "warning" ||
          item.operationStatus === "blocked" ||
          item.deliveryStatus === "NotConfigured",
      ).length,
    };
  }, [items, user]);

  const markVisible = () => {
    if (!user) return;
    markNotificationsRead(
      filtered.map((item) => item.id),
      user.id,
    );
    refresh();
  };

  const openRelated = (item: AppNotification) => {
    if (!item.relatedRoute) return;
    if (user) markNotificationRead(item.id, user.id);
    void navigate({ to: item.relatedRoute as "/" });
  };

  return (
    <AppShell>
      <PageHeader
        title="Notification Center"
        description="Organization-wide activity and communication delivery history. Demo ACL is localStorage-only; production requires server-side enforcement."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={markVisible}
              disabled={!user || filtered.length === 0}
            >
              Mark visible read
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link to="/settings/admin-access">Admin Access</Link>
            </Button>
          </div>
        }
      />

      <MetricGrid>
        <MetricCard
          icon={<Bell className="h-4 w-4" />}
          label="Total notifications"
          value={String(stats.total)}
        />
        <MetricCard
          icon={<Mail className="h-4 w-4" />}
          label="Unread"
          value={String(stats.unread)}
        />
        <MetricCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Successful operations"
          value={String(stats.succeeded)}
        />
        <MetricCard
          icon={<CircleX className="h-4 w-4" />}
          label="Failed operations"
          value={String(stats.failed)}
        />
        <MetricCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Warnings / blocked"
          value={String(stats.warnings)}
        />
      </MetricGrid>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {MODULE_FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setCategory(filter.id)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition",
              category === filter.id
                ? "border-[#2F6BFF] bg-[#EAF0FF] text-[#2F6BFF]"
                : "border-border/80 bg-card text-muted-foreground hover:bg-muted/40",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="crm-card">
        <div className="grid gap-2 border-b border-border/80 px-3 py-3 sm:grid-cols-4 sm:px-4">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search notifications…"
            className="h-9 rounded-xl"
          />
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger className="h-9 rounded-xl">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Information</SelectItem>
            </SelectContent>
          </Select>
          <Select value={delivery} onValueChange={setDelivery}>
            <SelectTrigger className="h-9 rounded-xl">
              <SelectValue placeholder="Delivery" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All delivery statuses</SelectItem>
              <SelectItem value="Queued">Queued</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Sent">Sent</SelectItem>
              <SelectItem value="Delivered">Delivered</SelectItem>
              <SelectItem value="Failed">Failed</SelectItem>
              <SelectItem value="NotConfigured">Not Configured</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="h-9 rounded-xl">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All dates</SelectItem>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-left text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className={TABLE_HEAD_CLASS}>Notification</th>
                <th className={TABLE_HEAD_CLASS}>Module</th>
                <th className={TABLE_HEAD_CLASS}>Severity</th>
                <th className={TABLE_HEAD_CLASS}>Delivery</th>
                <th className={TABLE_HEAD_CLASS}>Actor</th>
                <th className={TABLE_HEAD_CLASS}>When</th>
                <th className={`${TABLE_HEAD_CLASS} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const unread =
                  user != null && isNotificationUnread(item, user.id);
                return (
                  <tr key={item.id} className={TABLE_ROW_CLASS}>
                    <td className={TABLE_CELL_CLASS}>
                      <div className="flex min-w-0 items-start gap-2">
                        {unread ? (
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2F6BFF]" />
                        ) : (
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <TruncateWithTooltip
                            value={item.title}
                            className="max-w-[280px] font-semibold text-foreground"
                          />
                          <p className="mt-0.5 max-w-[280px] truncate text-[11px] text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={`${TABLE_CELL_CLASS} capitalize`}>
                      {item.module.replace(/-/g, " ")}
                    </td>
                    <td className={TABLE_CELL_CLASS}>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${SEVERITY_STYLE[item.severity]}`}
                      >
                        {item.severity}
                      </span>
                    </td>
                    <td className={`${TABLE_CELL_CLASS} text-muted-foreground`}>
                      {item.deliveryStatus ?? "—"}
                    </td>
                    <td className={TABLE_CELL_CLASS}>{item.actorName}</td>
                    <td className={`${TABLE_CELL_CLASS} text-muted-foreground`}>
                      {relativeTime(item.createdAt)}
                    </td>
                    <td className={TABLE_ACTION_CELL_CLASS}>
                      <RowActionsBar
                        primary={[
                          {
                            id: "view",
                            label: "View details",
                            icon: ACTION_ICONS.view,
                            onClick: () => {
                              setViewing(item);
                              if (user) markNotificationRead(item.id, user.id);
                            },
                          },
                          ...(item.relatedRoute
                            ? [
                                {
                                  id: "open",
                                  label: "Open related record",
                                  icon: ACTION_ICONS.activity,
                                  onClick: () => openRelated(item),
                                },
                              ]
                            : []),
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-muted-foreground"
                  >
                    No notifications match your filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={viewing !== null}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
      >
        {viewing ? (
          <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{viewing.title}</DialogTitle>
              <DialogDescription>{viewing.description}</DialogDescription>
            </DialogHeader>
            <dl className="grid gap-3 rounded-2xl bg-muted/50 p-4 sm:grid-cols-2">
              <Detail label="Module" value={viewing.module} />
              <Detail label="Event" value={viewing.eventType} />
              <Detail label="Severity" value={viewing.severity} />
              <Detail label="Operation" value={viewing.operationStatus} />
              <Detail label="Actor" value={viewing.actorName} />
              <Detail
                label="Created"
                value={formatCompactDate(viewing.createdAt.slice(0, 10))}
              />
              <Detail label="Channel" value={viewing.channel ?? "system"} />
              <Detail label="Delivery" value={viewing.deliveryStatus ?? "—"} />
              <Detail
                label="Related record"
                value={viewing.relatedRecordId ?? "—"}
              />
            </dl>
            {(viewing.channel === "email" ||
              viewing.channel === "whatsapp") && (
              <p className="flex items-start gap-2 rounded-xl border border-dashed border-[#D7E4FF] bg-[#F8FBFF] px-3 py-2 text-xs text-muted-foreground">
                {viewing.channel === "email" ? (
                  <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                ) : (
                  <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                )}
                Communication metadata only — message bodies and credentials are
                never stored. Live provider delivery is not simulated.
              </p>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setViewing(null)}
              >
                Close
              </Button>
              {viewing.relatedRoute ? (
                <Button
                  className="rounded-xl bg-[#2F6BFF] hover:bg-[#2558d9]"
                  onClick={() => {
                    openRelated(viewing);
                    setViewing(null);
                  }}
                >
                  Open related
                </Button>
              ) : null}
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>
    </AppShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium capitalize">{value}</dd>
    </div>
  );
}
