import { createFileRoute } from "@tanstack/react-router";

import { LoginPage } from "@/features/auth/LoginPage";
import { requireGuest } from "@/features/auth/guards";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in | Yaglob CRM" },
      {
        name: "description",
        content: "Sign in to the Yaglob CRM demo workspace.",
      },
    ],
  }),
  beforeLoad: async () => {
    await requireGuest();
  },
  component: LoginPage,
});
