import type {
  DeliveryChannel,
  DeliveryJob,
  DeliveryStatus,
} from "@/features/invoices/types/invoice.types";
import {
  mapDeliveryJobStatus,
  recordNotification,
} from "@/features/notifications/notificationStore";
import { getCurrentUser } from "@/features/auth/authStore";

function syncDeliveryNotification(job: DeliveryJob) {
  if (job.status !== "NotConfigured" && job.status !== "Failed") return;
  const user = getCurrentUser();
  const channelModule = job.channel === "whatsapp" ? "whatsapp" : "email";
  recordNotification({
    module: channelModule,
    eventType: `delivery.${job.status.toLowerCase()}`,
    title:
      job.status === "NotConfigured"
        ? `${job.channel === "whatsapp" ? "WhatsApp" : "Email"} not configured`
        : `${job.channel === "whatsapp" ? "WhatsApp" : "Email"} delivery failed`,
    description:
      job.message ??
      `Delivery job for invoice ${job.invoiceId} ended as ${job.status}.`,
    severity: job.status === "NotConfigured" ? "warning" : "error",
    operationStatus: job.status === "NotConfigured" ? "blocked" : "failed",
    actorUserId: user?.id ?? "system",
    actorName: user?.name ?? "System",
    relatedRecordId: job.invoiceId,
    relatedRoute: "/invoices",
    channel: job.channel,
    deliveryStatus: mapDeliveryJobStatus(job.status),
    idempotencyKey: `delivery-${job.id}-${job.status}`,
  });
}

const JOBS_KEY = "yaglob.invoice.deliveryJobs.default";

function readJobs(): Record<string, DeliveryJob> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(JOBS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, DeliveryJob>) : {};
  } catch {
    return {};
  }
}

function writeJobs(jobs: Record<string, DeliveryJob>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
}

function whatsappConfigured() {
  return Boolean(
    import.meta.env["VITE_WHATSAPP_ACCESS_TOKEN"] &&
    import.meta.env["VITE_WHATSAPP_PHONE_NUMBER_ID"],
  );
}

function emailConfigured() {
  return Boolean(
    import.meta.env["VITE_RESEND_API_KEY"] || import.meta.env["VITE_SMTP_URL"],
  );
}

function channelConfigured(channel: DeliveryChannel) {
  return channel === "whatsapp" ? whatsappConfigured() : emailConfigured();
}

export function createDeliveryJob(input: {
  invoiceId: string;
  channel: DeliveryChannel;
  idempotencyKey: string;
}): DeliveryJob {
  const existing = Object.values(readJobs()).find(
    (job) => job.idempotencyKey === input.idempotencyKey,
  );
  if (existing) return existing;

  const status: DeliveryStatus = channelConfigured(input.channel)
    ? "Pending"
    : "NotConfigured";
  const job: DeliveryJob = {
    id: `del-${Date.now()}-${input.channel}`,
    invoiceId: input.invoiceId,
    channel: input.channel,
    status,
    idempotencyKey: input.idempotencyKey,
    message:
      status === "NotConfigured"
        ? `${input.channel === "whatsapp" ? "WhatsApp" : "Email"} credentials are not configured.`
        : "Queued for delivery.",
    updatedAt: new Date().toISOString(),
  };
  const jobs = readJobs();
  jobs[job.id] = job;
  writeJobs(jobs);
  syncDeliveryNotification(job);
  return job;
}

/**
 * Phase A: never sends real messages.
 * If credentials are present we still mark Processing then Failed with a
 * development-safe message so production wiring can replace the adapter later.
 */
export async function processDeliveryJob(jobId: string): Promise<DeliveryJob> {
  const jobs = readJobs();
  const job = jobs[jobId];
  if (!job) throw new Error("Delivery job not found.");
  if (job.status === "NotConfigured") return job;
  if (job.status === "Sent" || job.status === "Delivered") return job;

  const processing: DeliveryJob = {
    ...job,
    status: "Processing",
    message: "Processing delivery request…",
    updatedAt: new Date().toISOString(),
  };
  jobs[jobId] = processing;
  writeJobs(jobs);

  await new Promise((resolve) => window.setTimeout(resolve, 250));

  const next: DeliveryJob = channelConfigured(job.channel)
    ? {
        ...processing,
        status: "Failed",
        message:
          "Provider credentials detected, but live sending is disabled in this development build. Use Phase B server adapters for production delivery.",
        updatedAt: new Date().toISOString(),
      }
    : {
        ...processing,
        status: "NotConfigured",
        message: "Provider credentials are not configured.",
        updatedAt: new Date().toISOString(),
      };

  jobs[jobId] = next;
  writeJobs(jobs);
  syncDeliveryNotification(next);
  return next;
}

export async function enqueueInvoiceDelivery(input: {
  invoiceId: string;
  channel: DeliveryChannel;
  idempotencyKey: string;
}) {
  const job = createDeliveryJob(input);
  if (job.status === "NotConfigured") return job;
  return processDeliveryJob(job.id);
}

export function listDeliveryJobsForInvoice(invoiceId: string) {
  return Object.values(readJobs()).filter((job) => job.invoiceId === invoiceId);
}

export async function retryDeliveryJob(jobId: string) {
  const jobs = readJobs();
  const job = jobs[jobId];
  if (!job) throw new Error("Delivery job not found.");
  const reset: DeliveryJob = {
    ...job,
    status: channelConfigured(job.channel) ? "Pending" : "NotConfigured",
    message: channelConfigured(job.channel)
      ? "Retry queued."
      : "Provider credentials are not configured.",
    updatedAt: new Date().toISOString(),
  };
  jobs[jobId] = reset;
  writeJobs(jobs);
  if (reset.status === "NotConfigured") return reset;
  return processDeliveryJob(jobId);
}

export function clearDeliveryJobs() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(JOBS_KEY);
}
