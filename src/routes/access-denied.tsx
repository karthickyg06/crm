import { createFileRoute } from "@tanstack/react-router";

import { AccessDeniedPage } from "@/features/auth/AccessDeniedPage";
import { requireAuthSession } from "@/features/auth/guards";

export const Route = createFileRoute("/access-denied")({
  validateSearch: (search: Record<string, unknown>) => ({
    module: typeof search["module"] === "string" ? search["module"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Access denied | Yaglob CRM" },
      {
        name: "description",
        content: "You do not have permission to view this module.",
      },
    ],
  }),
  beforeLoad: async () => {
    await requireAuthSession();
  },
  component: AccessDeniedPage,
});
