import { createFileRoute } from "@tanstack/react-router";
import { requireModuleAccess } from "@/features/auth/guards";
import { DealsPage } from "@/features/crm/pages";

export const Route = createFileRoute("/deals")({
  beforeLoad: async () => {
    await requireModuleAccess("deals", "view");
  },
  head: () => ({
    meta: [
      { title: "Deals & Pipeline | Yaglob CRM" },
      {
        name: "description",
        content: "Track every opportunity from first conversation to close.",
      },
      { property: "og:title", content: "Deals & Pipeline | Yaglob CRM" },
      {
        property: "og:description",
        content: "Track every opportunity from first conversation to close.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DealsPage,
});
