import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bell,
  CheckCheck,
  FileText,
  Package,
  Shield,
  Users,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/features/auth/useAuth";
import { cn } from "@/lib/utils";

import {
  countUnreadForUser,
  isNotificationUnread,
  listVisibleNotifications,
  markNotificationRead,
  markNotificationsRead,
  relativeTime,
  subscribeNotifications,
} from "./notificationStore";
import type { AppNotification, NotificationModule } from "./types";

function moduleIcon(module: NotificationModule) {
  switch (module) {
    case "leads":
    case "customers":
    case "deals":
      return Users;
    case "invoices":
    case "quotations":
      return FileText;
    case "payments":
      return Wallet;
    case "products":
    case "inventory":
    case "vendors":
    case "purchase-orders":
    case "goods-receiving":
      return Package;
    case "admin-access":
      return Shield;
    default:
      return Bell;
  }
}

export function NotificationBell() {
  const { user, can } = useAuth();
  const canViewOrg = can("notifications", "view");
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const refresh = () => {
      if (!user) {
        setItems([]);
        setUnread(0);
        return;
      }
      const visible = listVisibleNotifications({
        userId: user.id,
        canViewOrg,
      });
      setItems(visible.slice(0, 8));
      setUnread(
        countUnreadForUser({
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
      setUnread(0);
      return;
    }
    const visible = listVisibleNotifications({
      userId: user.id,
      canViewOrg,
    });
    setItems(visible.slice(0, 8));
    setUnread(
      countUnreadForUser({
        userId: user.id,
        canViewOrg,
      }),
    );
  };

  const markOne = (notification: AppNotification) => {
    if (!user) return;
    markNotificationRead(notification.id, user.id);
    refresh();
  };

  const markVisible = () => {
    if (!user || items.length === 0) return;
    markNotificationsRead(
      items.map((item) => item.id),
      user.id,
    );
    refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full"
          aria-label={
            unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
          }
        >
          <Bell className="h-4 w-4" />
          {unread > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-[#2F6BFF] px-1 text-[9px] font-bold leading-4 text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[360px] rounded-2xl border border-border/80 bg-card p-0 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.45)]"
      >
        <DropdownMenuLabel className="flex items-center justify-between gap-2 px-3 py-3">
          <span className="text-sm font-semibold">Notifications</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 rounded-lg px-2 text-[11px]"
            disabled={items.length === 0 || unread === 0}
            onClick={markVisible}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark visible read
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        <div className="max-h-[360px] overflow-y-auto p-1.5">
          {items.length === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-muted-foreground">
              You’re all caught up.
            </p>
          ) : (
            items.map((item) => {
              const Icon = moduleIcon(item.module);
              const unreadItem = user
                ? isNotificationUnread(item, user.id)
                : false;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition hover:bg-muted/50",
                    unreadItem && "bg-[#F5F8FF]",
                  )}
                  onClick={() => markOne(item)}
                >
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#EAF0FF] text-[#2F6BFF]">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="truncate text-xs font-semibold text-foreground">
                        {item.title}
                      </span>
                      {unreadItem ? (
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2F6BFF]" />
                      ) : null}
                    </span>
                    <span className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                      {item.description}
                    </span>
                    <span className="mt-1 block text-[10px] text-muted-foreground">
                      {relativeTime(item.createdAt)}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <DropdownMenuItem asChild className="m-1.5 justify-center rounded-xl">
          {canViewOrg ? (
            <Link
              to="/settings/notifications"
              className="w-full justify-center text-xs font-semibold text-[#2F6BFF]"
            >
              View All Notifications
            </Link>
          ) : (
            <span className="w-full cursor-default justify-center text-center text-[11px] text-muted-foreground">
              Ask an administrator for org-wide notification access.
            </span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
