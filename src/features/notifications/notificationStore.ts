/**
 * Versioned demo notification history.
 *
 * Privacy: do not store passwords, API tokens, or confidential message bodies.
 * RBAC filtering here is demo-only — production must enforce on the server.
 */

import type {
  AppNotification,
  CreateNotificationInput,
  NotificationDeliveryStatus,
  NotificationStoreState,
} from "./types";

const STORE_KEY = "yaglob.notifications.v1";
export const NOTIFICATION_STORE_VERSION = 1;
const MAX_NOTIFICATIONS = 400;

type Listener = () => void;
const listeners = new Set<Listener>();

function canUseStorage() {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
  listeners.forEach((listener) => listener());
}

export function subscribeNotifications(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emptyState(): NotificationStoreState {
  return { version: NOTIFICATION_STORE_VERSION, notifications: [] };
}

export function loadNotificationStore(): NotificationStoreState {
  const stored = readJson<NotificationStoreState | null>(STORE_KEY, null);
  if (
    stored?.version === NOTIFICATION_STORE_VERSION &&
    Array.isArray(stored.notifications)
  ) {
    return stored;
  }
  const initial = emptyState();
  writeJson(STORE_KEY, initial);
  return initial;
}

export function saveNotificationStore(state: NotificationStoreState) {
  writeJson(STORE_KEY, {
    version: NOTIFICATION_STORE_VERSION,
    notifications: state.notifications.slice(0, MAX_NOTIFICATIONS),
  });
  return state;
}

export function listNotifications() {
  return loadNotificationStore().notifications;
}

export function findNotificationByIdempotencyKey(key: string) {
  return listNotifications().find((item) => item.idempotencyKey === key);
}

export function recordNotification(
  input: CreateNotificationInput,
): AppNotification {
  const existing = findNotificationByIdempotencyKey(input.idempotencyKey);
  if (existing) return existing;

  const notification: AppNotification = {
    id: `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    module: input.module,
    eventType: input.eventType,
    title: input.title,
    description: input.description,
    severity: input.severity,
    operationStatus: input.operationStatus,
    createdAt: new Date().toISOString(),
    actorUserId: input.actorUserId,
    actorName: input.actorName,
    readByUserIds: [],
    idempotencyKey: input.idempotencyKey,
    ...(input.recipientUserId
      ? { recipientUserId: input.recipientUserId }
      : {}),
    ...(input.relatedRecordId
      ? { relatedRecordId: input.relatedRecordId }
      : {}),
    ...(input.relatedRoute ? { relatedRoute: input.relatedRoute } : {}),
    ...(input.channel ? { channel: input.channel } : {}),
    ...(input.deliveryStatus ? { deliveryStatus: input.deliveryStatus } : {}),
  };

  const state = loadNotificationStore();
  const notifications = [notification, ...state.notifications].slice(
    0,
    MAX_NOTIFICATIONS,
  );
  saveNotificationStore({ ...state, notifications });
  return notification;
}

export function markNotificationRead(id: string, userId: string) {
  const state = loadNotificationStore();
  const notifications = state.notifications.map((item) => {
    if (item.id !== id) return item;
    if (item.readByUserIds.includes(userId)) return item;
    return { ...item, readByUserIds: [...item.readByUserIds, userId] };
  });
  saveNotificationStore({ ...state, notifications });
}

export function markNotificationsRead(ids: string[], userId: string) {
  const idSet = new Set(ids);
  const state = loadNotificationStore();
  const notifications = state.notifications.map((item) => {
    if (!idSet.has(item.id) || item.readByUserIds.includes(userId)) return item;
    return { ...item, readByUserIds: [...item.readByUserIds, userId] };
  });
  saveNotificationStore({ ...state, notifications });
}

export function isNotificationUnread(
  notification: AppNotification,
  userId: string,
) {
  return !notification.readByUserIds.includes(userId);
}

/**
 * Personal feed: actor or recipient is the viewer.
 * Org feed: only when caller has notifications:view (checked by UI/route).
 */
export function listVisibleNotifications(input: {
  userId: string;
  canViewOrg: boolean;
}) {
  const all = listNotifications();
  if (input.canViewOrg) return all;
  return all.filter(
    (item) =>
      item.actorUserId === input.userId ||
      item.recipientUserId === input.userId,
  );
}

export function countUnreadForUser(input: {
  userId: string;
  canViewOrg: boolean;
}) {
  return listVisibleNotifications(input).filter((item) =>
    isNotificationUnread(item, input.userId),
  ).length;
}

export function mapDeliveryJobStatus(
  status: string,
): NotificationDeliveryStatus {
  switch (status) {
    case "Pending":
      return "Queued";
    case "Processing":
      return "Pending";
    case "Sent":
      return "Sent";
    case "Delivered":
      return "Delivered";
    case "Failed":
      return "Failed";
    case "NotConfigured":
      return "NotConfigured";
    case "Queued":
      return "Queued";
    case "Read":
      return "Read";
    default:
      return "Pending";
  }
}

export function relativeTime(iso: string) {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return iso;
  const delta = Date.now() - then;
  const minutes = Math.floor(delta / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(then));
}

export function clearNotificationStore() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(STORE_KEY);
  listeners.forEach((listener) => listener());
}
