import { createFileRoute } from "@tanstack/react-router";
import { requireModuleAccess } from "@/features/auth/guards";
import { InventoryPage } from "@/features/erp/pages/InventoryPage";

export const Route = createFileRoute("/inventory")({
  beforeLoad: async () => {
    await requireModuleAccess("inventory", "view");
  },
  head: () => ({
    meta: [
      { title: "Inventory | Yaglob CRM" },
      {
        name: "description",
        content: "Stock on hand, low-stock alerts, and stock movements.",
      },
    ],
  }),
  component: InventoryPage,
});
