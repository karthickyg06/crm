import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/features/crm/pages";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | Yaglob CRM" },
      { name: "description", content: "A live overview of revenue, customers, leads, and sales activity in Yaglob CRM." },
      { property: "og:title", content: "Dashboard | Yaglob CRM" },
      { property: "og:description", content: "A live overview of revenue, customers, leads, and sales activity in Yaglob CRM." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});
