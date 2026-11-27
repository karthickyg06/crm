import { useState } from "react";
import { CreditCard } from "lucide-react";
import { notify } from "@/features/notifications/notify";

import { Button } from "@/components/ui/button";
import {
  ACTION_ICONS,
  ActionIconButton,
  AppShell,
  DataTable,
  MetricCard,
  MetricGrid,
  PageHeader,
  currency,
  type DataColumn,
} from "@/features/crm/shared";
import { useAuth } from "@/features/auth/useAuth";
import { listPayments } from "@/features/erp/demoStore";
import {
  downloadPaymentReceipt,
  printPaymentReceipt,
} from "@/features/erp/receiptService";
import type { PaymentRecord } from "@/features/erp/types";

export function PaymentsPage() {
  const { can } = useAuth();
  const canDownload = can("payments", "download");
  const canPrint = can("payments", "print");
  const [payments, setPayments] = useState(() => listPayments());

  const totalReceived = payments.reduce((sum, row) => sum + row.amount, 0);

  const columns: DataColumn<PaymentRecord>[] = [
    {
      id: "paidAt",
      label: "Date",
      render: (row) => row.paidAt,
    },
    {
      id: "invoice",
      label: "Invoice",
      render: (row) => (
        <span className="font-semibold text-[#2F6BFF]">
          {row.invoiceNumber}
        </span>
      ),
    },
    {
      id: "customer",
      label: "Customer",
      render: (row) => row.customerName,
    },
    {
      id: "method",
      label: "Method",
      render: (row) => row.method,
    },
    {
      id: "reference",
      label: "Reference",
      render: (row) => row.reference || "—",
    },
    {
      id: "amount",
      label: "Amount",
      render: (row) => (
        <span className="tabular-nums font-semibold">
          {currency(row.amount)}
        </span>
      ),
    },
    {
      id: "actions",
      label: "",
      className: "w-[96px] text-right",
      render: (row) => (
        <div className="inline-flex items-center justify-end gap-0.5">
          {canDownload ? (
            <ActionIconButton
              icon={ACTION_ICONS.download}
              label="Download receipt"
              onClick={() =>
                void downloadPaymentReceipt(row)
                  .then(() => notify.success("Receipt downloaded."))
                  .catch(() => notify.error("Unable to download receipt."))
              }
            />
          ) : null}
          {canPrint ? (
            <ActionIconButton
              icon={ACTION_ICONS.print}
              label="Print receipt"
              onClick={() =>
                void printPaymentReceipt(row)
                  .then(() => notify.info("Receipt print dialog opened."))
                  .catch((error) =>
                    notify.error(
                      error instanceof Error
                        ? error.message
                        : "Unable to print receipt.",
                    ),
                  )
              }
            />
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Payments"
        description="Central payment ledger from recorded invoice collections."
        actions={
          <Button
            size="sm"
            variant="outline"
            className="h-9 rounded-md"
            onClick={() => setPayments(listPayments())}
          >
            Refresh
          </Button>
        }
      />
      <MetricGrid>
        <MetricCard
          icon={<CreditCard className="h-4 w-4" />}
          label="Payments"
          value={String(payments.length)}
          change="0%"
        />
        <MetricCard
          icon={<CreditCard className="h-4 w-4" />}
          label="Total received"
          value={currency(totalReceived)}
          change="0%"
        />
      </MetricGrid>
      <DataTable
        rows={payments}
        columns={columns}
        searchPlaceholder="Search payments…"
      />
    </AppShell>
  );
}
