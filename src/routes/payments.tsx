import { createFileRoute } from "@tanstack/react-router";
import { requireModuleAccess } from "@/features/auth/guards";
import { PaymentsPage } from "@/features/erp/pages/PaymentsPage";

export const Route = createFileRoute("/payments")({
  beforeLoad: async () => {
    await requireModuleAccess("payments", "view");
  },
  head: () => ({
    meta: [
      { title: "Payments | Yaglob CRM" },
      {
        name: "description",
        content: "Central ledger of recorded invoice payments and receipts.",
      },
    ],
  }),
  component: PaymentsPage,
});
