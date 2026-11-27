import { createFileRoute } from "@tanstack/react-router";
import { requireModuleAccess } from "@/features/auth/guards";
import { PurchaseOrdersPage } from "@/features/erp/pages/InventoryPage";

export const Route = createFileRoute("/purchase-orders")({
  beforeLoad: async () => {
    await requireModuleAccess("purchase-orders", "view");
  },
  head: () => ({
    meta: [
      { title: "Purchase Orders | Yaglob CRM" },
      {
        name: "description",
        content: "Create and manage purchase orders. Stock updates on receive.",
      },
    ],
  }),
  component: PurchaseOrdersPage,
});
