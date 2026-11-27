import { createFileRoute } from "@tanstack/react-router";
import { requireModuleAccess } from "@/features/auth/guards";
import { ProductsPage } from "@/features/erp/pages/ProductsPage";

export const Route = createFileRoute("/products")({
  beforeLoad: async () => {
    await requireModuleAccess("products", "view");
  },
  head: () => ({
    meta: [
      { title: "Products & Services | Yaglob CRM" },
      {
        name: "description",
        content: "Manage the shared product and service catalog.",
      },
    ],
  }),
  component: ProductsPage,
});
