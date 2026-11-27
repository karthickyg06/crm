import { createFileRoute } from "@tanstack/react-router";

import { requireModuleAccess } from "@/features/auth/guards";
import { NotificationCenterPage } from "@/features/notifications/NotificationCenterPage";

export const Route = createFileRoute("/settings/notifications")({
  head: () => ({
    meta: [
      { title: "Notification Center | Yaglob CRM" },
      {
        name: "description",
        content:
          "Organization notification history and communication delivery status.",
      },
    ],
  }),
  beforeLoad: async () => {
    await requireModuleAccess("notifications", "view");
  },
  component: NotificationCenterPage,
});
