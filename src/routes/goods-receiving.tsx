import { createFileRoute } from "@tanstack/react-router";
import { requireModuleAccess } from "@/features/auth/guards";
import { GoodsReceivingPage } from "@/features/erp/pages/InventoryPage";

export const Route = createFileRoute("/goods-receiving")({
  beforeLoad: async () => {
    await requireModuleAccess("goods-receiving", "view");
  },
  head: () => ({
    meta: [
      { title: "Goods Receiving | Yaglob CRM" },
      {
        name: "description",
        content: "Receive goods against open purchase orders.",
      },
    ],
  }),
  component: GoodsReceivingPage,
});
