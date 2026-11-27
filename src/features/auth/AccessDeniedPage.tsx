import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { firstAuthorizedPath, getCurrentUser } from "@/features/auth/authStore";

export function AccessDeniedPage() {
  const user = getCurrentUser();
  const destination = firstAuthorizedPath(user);
  const hasAnyModule = Boolean(user) && destination !== "/access-denied";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#F8FAFC_0%,#EEF4FF_50%,#FFFFFF_100%)] px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-[0_18px_50px_-28px_rgba(15,23,42,0.45)]">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-[#FFF4E8] text-[#DF9B60]">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">Access restricted</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {hasAnyModule
            ? "You do not have permission to open this module. Ask a Super Admin to update your role or permissions."
            : "No modules are assigned to this account. Contact a Super Admin to grant access before continuing."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {hasAnyModule ? (
            <Button
              asChild
              className="rounded-xl bg-[#2F6BFF] hover:bg-[#2558d9]"
            >
              <Link to={destination}>Return to workspace</Link>
            </Button>
          ) : null}
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/login">Sign in with another account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
