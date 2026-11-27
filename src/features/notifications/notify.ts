import { toast as sonnerToast } from "sonner";

import { getCurrentUser } from "@/features/auth/authStore";

import {
  findNotificationByIdempotencyKey,
  recordNotification,
} from "./notificationStore";
import type {
  CreateNotificationInput,
  NotificationModule,
  NotificationOperationStatus,
  NotificationSeverity,
} from "./types";

type ToastInput = {
  title: string;
  description?: string;
  id?: string;
  duration?: number;
};

function toastId(severity: NotificationSeverity, title: string, id?: string) {
  return id ?? `toast-${severity}-${title}`;
}

function show(
  severity: NotificationSeverity,
  { title, description, id, duration }: ToastInput,
) {
  const toastIdValue = toastId(severity, title, id);
  const options = {
    id: toastIdValue,
    description,
    duration:
      duration ??
      (severity === "error" ? 7000 : severity === "warning" ? 5500 : 4200),
  };

  switch (severity) {
    case "success":
      return sonnerToast.success(title, options);
    case "error":
      return sonnerToast.error(title, options);
    case "warning":
      return sonnerToast.warning(title, options);
    default:
      return sonnerToast.info(title, options);
  }
}

export const notify = {
  success: (input: ToastInput | string) =>
    show("success", typeof input === "string" ? { title: input } : input),
  error: (input: ToastInput | string) =>
    show("error", typeof input === "string" ? { title: input } : input),
  warning: (input: ToastInput | string) =>
    show("warning", typeof input === "string" ? { title: input } : input),
  info: (input: ToastInput | string) =>
    show("info", typeof input === "string" ? { title: input } : input),
  /** Plain message — prefer typed helpers for new call sites. */
  message: (title: string, description?: string) =>
    show("info", {
      title,
      ...(description ? { description } : {}),
    }),
};

export type RecordAndToastInput = {
  module: NotificationModule;
  eventType: string;
  title: string;
  description: string;
  severity: NotificationSeverity;
  operationStatus: NotificationOperationStatus;
  relatedRecordId?: string;
  relatedRoute?: string;
  recipientUserId?: string;
  channel?: CreateNotificationInput["channel"];
  deliveryStatus?: CreateNotificationInput["deliveryStatus"];
  idempotencyKey: string;
  toast?: boolean;
};

export function recordAndToast(input: RecordAndToastInput) {
  const user = getCurrentUser();
  const actorUserId = user?.id ?? "system";
  const actorName = user?.name ?? "System";

  const existing = findNotificationByIdempotencyKey(input.idempotencyKey);
  const notification =
    existing ??
    recordNotification({
      module: input.module,
      eventType: input.eventType,
      title: input.title,
      description: input.description,
      severity: input.severity,
      operationStatus: input.operationStatus,
      actorUserId,
      actorName,
      idempotencyKey: input.idempotencyKey,
      ...(input.relatedRecordId
        ? { relatedRecordId: input.relatedRecordId }
        : {}),
      ...(input.relatedRoute ? { relatedRoute: input.relatedRoute } : {}),
      ...(input.recipientUserId
        ? { recipientUserId: input.recipientUserId }
        : {}),
      ...(input.channel ? { channel: input.channel } : {}),
      ...(input.deliveryStatus ? { deliveryStatus: input.deliveryStatus } : {}),
    });

  if (input.toast !== false) {
    show(input.severity, {
      title: input.title,
      ...(input.description ? { description: input.description } : {}),
      id: `persist-${input.idempotencyKey}`,
    });
  }

  return notification;
}
