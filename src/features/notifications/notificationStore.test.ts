import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  clearNotificationStore,
  countUnreadForUser,
  findNotificationByIdempotencyKey,
  listVisibleNotifications,
  mapDeliveryJobStatus,
  markNotificationRead,
  recordNotification,
} from "./notificationStore";

function mockStorage() {
  const store: Record<string, string> = {};
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
          store[key] = value;
        },
        removeItem: (key: string) => {
          delete store[key];
        },
      },
    },
  });
  return store;
}

describe("Notification store", () => {
  beforeEach(() => {
    mockStorage();
    clearNotificationStore();
  });

  afterEach(() => {
    clearNotificationStore();
  });

  it("records notifications and prevents duplicate idempotency keys", () => {
    const first = recordNotification({
      module: "leads",
      eventType: "lead.created",
      title: "Lead created",
      description: "Acme lead saved.",
      severity: "success",
      operationStatus: "succeeded",
      actorUserId: "u1",
      actorName: "Admin",
      idempotencyKey: "lead-created-1",
    });
    const second = recordNotification({
      module: "leads",
      eventType: "lead.created",
      title: "Lead created again",
      description: "Should not duplicate.",
      severity: "success",
      operationStatus: "succeeded",
      actorUserId: "u1",
      actorName: "Admin",
      idempotencyKey: "lead-created-1",
    });
    expect(second.id).toBe(first.id);
    expect(findNotificationByIdempotencyKey("lead-created-1")?.title).toBe(
      "Lead created",
    );
  });

  it("isolates employee feeds from org-wide history", () => {
    recordNotification({
      module: "invoices",
      eventType: "invoice.issued",
      title: "Invoice issued",
      description: "INV-1",
      severity: "success",
      operationStatus: "succeeded",
      actorUserId: "admin",
      actorName: "Admin",
      idempotencyKey: "inv-1",
    });
    recordNotification({
      module: "leads",
      eventType: "lead.created",
      title: "My lead",
      description: "Employee action",
      severity: "success",
      operationStatus: "succeeded",
      actorUserId: "emp",
      actorName: "Employee",
      idempotencyKey: "lead-emp-1",
    });

    const employeeView = listVisibleNotifications({
      userId: "emp",
      canViewOrg: false,
    });
    expect(employeeView).toHaveLength(1);
    expect(employeeView[0]?.title).toBe("My lead");

    const adminView = listVisibleNotifications({
      userId: "admin",
      canViewOrg: true,
    });
    expect(adminView).toHaveLength(2);
  });

  it("tracks unread counts and mark-as-read", () => {
    const item = recordNotification({
      module: "payments",
      eventType: "payment.recorded",
      title: "Payment recorded",
      description: "₹1000",
      severity: "success",
      operationStatus: "succeeded",
      actorUserId: "u1",
      actorName: "Admin",
      recipientUserId: "u1",
      idempotencyKey: "pay-1",
    });
    expect(
      countUnreadForUser({ userId: "u1", canViewOrg: true }),
    ).toBeGreaterThan(0);
    markNotificationRead(item.id, "u1");
    expect(countUnreadForUser({ userId: "u1", canViewOrg: true })).toBe(0);
  });

  it("maps delivery job statuses without inventing Read/Sent", () => {
    expect(mapDeliveryJobStatus("NotConfigured")).toBe("NotConfigured");
    expect(mapDeliveryJobStatus("Failed")).toBe("Failed");
    expect(mapDeliveryJobStatus("Pending")).toBe("Queued");
    expect(mapDeliveryJobStatus("Processing")).toBe("Pending");
  });
});
