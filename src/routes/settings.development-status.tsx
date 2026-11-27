import { createFileRoute } from "@tanstack/react-router";

import { DevelopmentStatusPage } from "@/features/auth/DevelopmentStatusPage";
import { requireModuleAccess } from "@/features/auth/guards";

export const Route = createFileRoute("/settings/development-status")({
  head: () => ({
    meta: [
      { title: "Development Status | Yaglob CRM" },
      {
        name: "description",
        content: "Internal product development status and roadmap.",
      },
    ],
  }),
  beforeLoad: async () => {
    await requireModuleAccess("development-status", "view");
  },
  component: DevelopmentStatusPage,
});
