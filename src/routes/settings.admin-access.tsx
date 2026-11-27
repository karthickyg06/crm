import { createFileRoute } from "@tanstack/react-router";

import { AdminAccessPage } from "@/features/auth/AdminAccessPage";
import { requireModuleAccess } from "@/features/auth/guards";

export const Route = createFileRoute("/settings/admin-access")({
  head: () => ({
    meta: [
      { title: "Admin Access | Yaglob CRM" },
      {
        name: "description",
        content: "Manage users, roles, and module permissions.",
      },
    ],
  }),
  beforeLoad: async () => {
    await requireModuleAccess("admin-access", "view");
  },
  component: AdminAccessPage,
});
