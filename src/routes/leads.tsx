import { createFileRoute } from "@tanstack/react-router";
import { requireModuleAccess } from "@/features/auth/guards";
import { LeadsPage } from "@/features/crm/pages";

export const Route = createFileRoute("/leads")({
  beforeLoad: async () => {
    await requireModuleAccess("leads", "view");
  },
  head: () => ({
    meta: [
      { title: "Leads | Yaglob CRM" },
      {
        name: "description",
        content: "Track, qualify, and convert every opportunity in Yaglob CRM.",
      },
      { property: "og:title", content: "Leads | Yaglob CRM" },
      {
        property: "og:description",
        content: "Track, qualify, and convert every opportunity in Yaglob CRM.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeadsPage,
});
