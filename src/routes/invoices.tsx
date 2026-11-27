import { createFileRoute } from "@tanstack/react-router";
import { requireModuleAccess } from "@/features/auth/guards";
import { InvoicesPage } from "@/features/crm/pages";

export const Route = createFileRoute("/invoices")({
  beforeLoad: async () => {
    await requireModuleAccess("invoices", "view");
  },
  head: () => ({
    meta: [
      { title: "Invoices | Yaglob CRM" },
      {
        name: "description",
        content: "Create, review, and keep track of customer billing.",
      },
      { property: "og:title", content: "Invoices | Yaglob CRM" },
      {
        property: "og:description",
        content: "Create, review, and keep track of customer billing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InvoicesPage,
});
