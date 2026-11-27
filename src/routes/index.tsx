import { createFileRoute, redirect } from "@tanstack/react-router";

import { DashboardPage } from "@/features/crm/pages";
import { firstAuthorizedPath, userCan } from "@/features/auth/authStore";
import { requireAuthSession } from "@/features/auth/guards";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | Yaglob CRM" },
      {
        name: "description",
        content:
          "A live overview of revenue, customers, leads, and sales activity in Yaglob CRM.",
      },
      { property: "og:title", content: "Dashboard | Yaglob CRM" },
      {
        property: "og:description",
        content:
          "A live overview of revenue, customers, leads, and sales activity in Yaglob CRM.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: async () => {
    const user = await requireAuthSession();
    if (!userCan(user, "dashboard", "view")) {
      throw redirect({ to: firstAuthorizedPath(user) });
    }
  },
  component: DashboardPage,
});
