import { Outlet, createFileRoute } from "@tanstack/react-router";

import { requireAuthSession } from "@/features/auth/guards";

export const Route = createFileRoute("/settings")({
  beforeLoad: async () => {
    await requireAuthSession();
  },
  component: () => <Outlet />,
});
