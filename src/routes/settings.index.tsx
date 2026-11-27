import { createFileRoute } from "@tanstack/react-router";

import { SettingsPage } from "@/features/erp/pages/SettingsPage";
import { requireModuleAccess } from "@/features/auth/guards";

export const Route = createFileRoute("/settings/")({
  head: () => ({
    meta: [
      { title: "Settings | Yaglob CRM" },
      {
        name: "description",
        content: "Company and invoice preferences for the workspace.",
      },
    ],
  }),
  beforeLoad: async () => {
    await requireModuleAccess("settings", "view");
  },
  component: SettingsPage,
});
