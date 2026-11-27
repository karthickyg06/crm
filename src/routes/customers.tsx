import { createFileRoute } from "@tanstack/react-router";
import { requireModuleAccess } from "@/features/auth/guards";
import { CustomersPage } from "@/features/crm/pages";

export const Route = createFileRoute("/customers")({
  beforeLoad: async () => {
    await requireModuleAccess("customers", "view");
  },
  head: () => ({
    meta: [
      { title: "Customers | Yaglob CRM" },
      {
        name: "description",
        content:
          "Manage relationships, account details, and outstanding balances.",
      },
      { property: "og:title", content: "Customers | Yaglob CRM" },
      {
        property: "og:description",
        content:
          "Manage relationships, account details, and outstanding balances.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CustomersPage,
});
