import { createFileRoute } from "@tanstack/react-router";
import { requireModuleAccess } from "@/features/auth/guards";
import { VendorsPage } from "@/features/erp/pages/InventoryPage";

export const Route = createFileRoute("/vendors")({
  beforeLoad: async () => {
    await requireModuleAccess("vendors", "view");
  },
  head: () => ({
    meta: [
      { title: "Vendors | Yaglob CRM" },
      {
        name: "description",
        content: "Manage vendors for purchase orders and goods receiving.",
      },
    ],
  }),
  component: VendorsPage,
});
