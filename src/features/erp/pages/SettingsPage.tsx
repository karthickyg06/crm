import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { AppShell, PageHeader } from "@/features/crm/shared";
import { InvoiceSettingsPanel } from "@/features/invoices/components/InvoiceSettingsPanel";

export function SettingsPage() {
  const { can } = useAuth();
  return (
    <AppShell>
      <PageHeader
        title="Settings"
        description="Company profile, invoice defaults, and demo data controls."
        actions={
          <div className="flex flex-wrap gap-2">
            {can("admin-access", "view") ? (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="rounded-xl"
              >
                <Link to="/settings/admin-access">Admin Access</Link>
              </Button>
            ) : null}
            {can("development-status", "view") ? (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="rounded-xl"
              >
                <Link to="/settings/development-status">
                  Development Status
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />
      <div className="crm-card p-4 sm:p-5">
        <InvoiceSettingsPanel />
      </div>
    </AppShell>
  );
}
