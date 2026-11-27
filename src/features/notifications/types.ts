/**
 * Demo notification types.
 * localStorage ACL is demo-only — production requires server-side enforcement.
 */

export type NotificationSeverity = "success" | "error" | "warning" | "info";

export type NotificationOperationStatus =
  "succeeded" | "failed" | "blocked" | "warning";

export type NotificationModule =
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
  | "email"
  | "whatsapp"
  | "admin-access"
  | "system";

export type NotificationChannel = "email" | "whatsapp" | "system";

/** Delivery status including reserved Read (never faked in this sprint). */
export type NotificationDeliveryStatus =
  | "Pending"
  | "Queued"
  | "Sent"
  | "Delivered"
  | "Read"
  | "Failed"
  | "NotConfigured";

export type AppNotification = {
  id: string;
  module: NotificationModule;
  eventType: string;
  title: string;
  description: string;
  severity: NotificationSeverity;
  operationStatus: NotificationOperationStatus;
  createdAt: string;
  actorUserId: string;
  actorName: string;
  recipientUserId?: string;
  relatedRecordId?: string;
  relatedRoute?: string;
  readByUserIds: string[];
  channel?: NotificationChannel;
  deliveryStatus?: NotificationDeliveryStatus;
  idempotencyKey: string;
};

export type NotificationStoreState = {
  version: number;
  notifications: AppNotification[];
};

export type CreateNotificationInput = {
  module: NotificationModule;
  eventType: string;
  title: string;
  description: string;
  severity: NotificationSeverity;
  operationStatus: NotificationOperationStatus;
  actorUserId: string;
  actorName: string;
  recipientUserId?: string;
  relatedRecordId?: string;
  relatedRoute?: string;
  channel?: NotificationChannel;
  deliveryStatus?: NotificationDeliveryStatus;
  idempotencyKey: string;
};
