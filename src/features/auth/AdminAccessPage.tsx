import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  Plus,
  ShieldCheck,
  UserCheck,
  UserRound,
  UserX,
  Users,
} from "lucide-react";
import { notify, recordAndToast } from "@/features/notifications/notify";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ACTION_ICONS,
  AppShell,
  FormField,
  MetricCard,
  MetricGrid,
  PageHeader,
  RowActionsBar,
  StatusBadge,
  TABLE_ACTION_CELL_CLASS,
  TABLE_CELL_CLASS,
  TABLE_HEAD_CLASS,
  TABLE_ROW_CLASS,
  formatCompactDate,
  initials,
  useConfirmAction,
} from "@/features/crm/shared";
import {
  deleteAuthUser,
  ensureAuthBootstrapped,
  listUsers,
  resetUserDemoPassword,
  setUserStatus,
  subscribeAuthStore,
  upsertAuthUser,
} from "@/features/auth/authStore";
import { MODULE_REGISTRY } from "@/features/auth/permissions";
import {
  ROLE_TEMPLATES,
  defaultPermissionsForRole,
} from "@/features/auth/roles";
import type {
  AccountStatus,
  ActionId,
  AuthUser,
  ModuleId,
  ModulePermission,
  RoleId,
} from "@/features/auth/types";

function emptyPermissions(): ModulePermission[] {
  return [];
}

function roleLabel(roleId: RoleId) {
  return ROLE_TEMPLATES.find((role) => role.id === roleId)?.label ?? roleId;
}

function countActiveSuperAdmins(users: AuthUser[]) {
  return users.filter(
    (user) => user.status === "Active" && user.roleId === "super-admin",
  ).length;
}

export function AdminAccessPage() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AuthUser | null>(null);
  const [viewing, setViewing] = useState<AuthUser | null>(null);
  const [resetTarget, setResetTarget] = useState<AuthUser | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [tab, setTab] = useState<"users" | "roles" | "permissions">("users");
  const { ask, dialog: confirmDialog } = useConfirmAction();

  const refresh = () => setUsers(listUsers());

  useEffect(() => {
    void ensureAuthBootstrapped().then(refresh);
    return subscribeAuthStore(refresh);
  }, []);

  const filtered = users.filter((user) => {
    const haystack =
      `${user.name} ${user.email} ${user.department} ${user.designation}`.toLowerCase();
    const matchesQuery =
      !query.trim() || haystack.includes(query.trim().toLowerCase());
    const matchesRole = roleFilter === "all" || user.roleId === roleFilter;
    const matchesStatus =
      statusFilter === "all" || user.status === statusFilter;
    return matchesQuery && matchesRole && matchesStatus;
  });

  const activeCount = users.filter((user) => user.status === "Active").length;
  const superAdminCount = countActiveSuperAdmins(users);

  return (
    <AppShell>
      <PageHeader
        title="Admin Access"
        description="Manage demo users, roles, and module permissions."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link to="/settings">Company settings</Link>
            </Button>
            <Button
              size="sm"
              className="h-10 gap-2 rounded-xl bg-[#2F6BFF] hover:bg-[#2558d9]"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> Add User
            </Button>
          </div>
        }
      />

      <MetricGrid>
        <MetricCard
          icon={<Users className="h-4 w-4" />}
          label="Total users"
          value={String(users.length)}
        />
        <MetricCard
          icon={<UserCheck className="h-4 w-4" />}
          label="Active users"
          value={String(activeCount)}
        />
        <MetricCard
          icon={<UserX className="h-4 w-4" />}
          label="Inactive users"
          value={String(users.length - activeCount)}
        />
        <MetricCard
          icon={<ShieldCheck className="h-4 w-4" />}
          label="Available roles"
          value={String(ROLE_TEMPLATES.length)}
        />
      </MetricGrid>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["users", "roles", "permissions"] as const).map((item) => (
          <Button
            key={item}
            type="button"
            size="sm"
            variant={tab === item ? "default" : "outline"}
            className="rounded-full capitalize"
            onClick={() => setTab(item)}
          >
            {item}
          </Button>
        ))}
      </div>

      {tab === "users" ? (
        <div className="crm-card space-y-3">
          <div className="grid gap-2 border-b border-border/80 px-3 py-3 sm:grid-cols-3 sm:px-4">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search users…"
              className="h-9 rounded-xl"
            />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-9 rounded-xl">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {ROLE_TEMPLATES.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className={TABLE_HEAD_CLASS}>User</th>
                  <th className={TABLE_HEAD_CLASS}>Role</th>
                  <th className={TABLE_HEAD_CLASS}>Status</th>
                  <th className={TABLE_HEAD_CLASS}>Org</th>
                  <th className={TABLE_HEAD_CLASS}>Created</th>
                  <th className={TABLE_HEAD_CLASS}>Last login</th>
                  <th className={`${TABLE_HEAD_CLASS} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const isLastSuperAdmin =
                    user.roleId === "super-admin" &&
                    user.status === "Active" &&
                    superAdminCount <= 1;
                  return (
                    <tr key={user.id} className={TABLE_ROW_CLASS}>
                      <td className={TABLE_CELL_CLASS}>
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#EAF0FF] text-[10px] font-semibold text-[#2F6BFF]">
                            {initials(user.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">
                              {user.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={TABLE_CELL_CLASS}>
                        <span className="whitespace-nowrap text-sm">
                          {roleLabel(user.roleId)}
                        </span>
                      </td>
                      <td className={TABLE_CELL_CLASS}>
                        <StatusBadge status={user.status} />
                      </td>
                      <td className={TABLE_CELL_CLASS}>
                        <div className="min-w-0">
                          <p className="truncate text-sm">{user.department}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {user.designation}
                          </p>
                        </div>
                      </td>
                      <td
                        className={`${TABLE_CELL_CLASS} text-muted-foreground`}
                      >
                        {formatCompactDate(user.createdAt)}
                      </td>
                      <td
                        className={`${TABLE_CELL_CLASS} text-muted-foreground`}
                      >
                        {formatCompactDate(user.lastLoginAt)}
                      </td>
                      <td className={TABLE_ACTION_CELL_CLASS}>
                        <RowActionsBar
                          primary={[
                            {
                              id: "edit",
                              label: "Edit user",
                              icon: ACTION_ICONS.edit,
                              onClick: () => {
                                setEditing(user);
                                setOpen(true);
                              },
                            },
                            {
                              id: "permissions",
                              label: "Manage permissions",
                              icon: ACTION_ICONS.permissions,
                              onClick: () => {
                                setEditing(user);
                                setOpen(true);
                              },
                            },
                          ]}
                          menuItems={[
                            {
                              id: "view",
                              label: "View details",
                              icon: ACTION_ICONS.view,
                              onSelect: () => setViewing(user),
                            },
                            {
                              id: "reset",
                              label: "Reset password",
                              icon: ACTION_ICONS.resetPassword,
                              onSelect: () => {
                                setResetPassword("");
                                setResetConfirm("");
                                setResetTarget(user);
                              },
                            },
                            {
                              id: "toggle",
                              label:
                                user.status === "Active"
                                  ? "Deactivate"
                                  : "Activate",
                              icon:
                                user.status === "Active"
                                  ? ACTION_ICONS.deactivate
                                  : ACTION_ICONS.activate,
                              disabled: isLastSuperAdmin,
                              disabledReason:
                                "Cannot deactivate the last active Super Admin.",
                              onSelect: () => {
                                ask({
                                  title:
                                    user.status === "Active"
                                      ? "Deactivate user?"
                                      : "Activate user?",
                                  description: `${user.name} (${user.email}) will be marked ${
                                    user.status === "Active"
                                      ? "Inactive"
                                      : "Active"
                                  }.`,
                                  confirmLabel:
                                    user.status === "Active"
                                      ? "Deactivate"
                                      : "Activate",
                                  destructive: user.status === "Active",
                                  onConfirm: () => {
                                    try {
                                      setUserStatus(
                                        user.id,
                                        user.status === "Active"
                                          ? "Inactive"
                                          : "Active",
                                      );
                                      recordAndToast({
                                        module: "admin-access",
                                        eventType:
                                          user.status === "Active"
                                            ? "user.deactivated"
                                            : "user.activated",
                                        title:
                                          user.status === "Active"
                                            ? "User deactivated"
                                            : "User activated",
                                        description: user.email,
                                        severity: "warning",
                                        operationStatus: "succeeded",
                                        relatedRecordId: user.id,
                                        relatedRoute: "/settings/admin-access",
                                        recipientUserId: user.id,
                                        idempotencyKey: `user-status-${user.id}-${Date.now()}`,
                                      });
                                      refresh();
                                    } catch (error) {
                                      notify.error(
                                        error instanceof Error
                                          ? error.message
                                          : "Unable to update status.",
                                      );
                                    }
                                  },
                                });
                              },
                            },
                            {
                              id: "delete",
                              label: "Delete",
                              icon: ACTION_ICONS.delete,
                              tone: "danger",
                              disabled: isLastSuperAdmin,
                              disabledReason:
                                "Cannot delete the last active Super Admin.",
                              onSelect: () => {
                                ask({
                                  title: "Delete user?",
                                  description: `Remove ${user.name} from the demo directory. This cannot be undone.`,
                                  confirmLabel: "Delete user",
                                  destructive: true,
                                  onConfirm: () => {
                                    try {
                                      deleteAuthUser(user.id);
                                      recordAndToast({
                                        module: "admin-access",
                                        eventType: "user.deleted",
                                        title: "User removed",
                                        description: user.email,
                                        severity: "warning",
                                        operationStatus: "succeeded",
                                        relatedRecordId: user.id,
                                        relatedRoute: "/settings/admin-access",
                                        idempotencyKey: `user-del-${user.id}-${Date.now()}`,
                                      });
                                      refresh();
                                    } catch (error) {
                                      notify.error(
                                        error instanceof Error
                                          ? error.message
                                          : "Unable to delete user.",
                                      );
                                    }
                                  },
                                });
                              },
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-sm text-muted-foreground"
                    >
                      No users match your search.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === "roles" ? (
        <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
          {ROLE_TEMPLATES.map((role) => (
            <div key={role.id} className="crm-card p-4">
              <h3 className="font-semibold">{role.label}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {role.description}
              </p>
              <p className="mt-3 text-xs">
                Default modules:{" "}
                {role.defaultPermissions.length === 0
                  ? "None (custom)"
                  : role.defaultPermissions
                      .map((entry) => entry.moduleId)
                      .join(", ")}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "permissions" ? (
        <div className="crm-card p-4 text-sm">
          <p className="text-muted-foreground">
            Open Add/Edit User to apply role templates or customize module and
            action permissions. Deny-by-default applies to every new module.
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {MODULE_REGISTRY.map((module) => (
              <li
                key={module.id}
                className="rounded-lg border border-border/70 px-3 py-2"
              >
                <p className="font-medium">{module.label}</p>
                <p className="text-xs text-muted-foreground">
                  {module.actions.join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <UserFormDialog
        open={open}
        editing={editing}
        onOpenChange={setOpen}
        onSaved={() => {
          refresh();
          setOpen(false);
        }}
      />

      <Dialog
        open={viewing !== null}
        onOpenChange={(next) => {
          if (!next) setViewing(null);
        }}
      >
        {viewing ? (
          <DialogContent className="rounded-2xl sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>User details</DialogTitle>
              <DialogDescription>
                Account profile for {viewing.name}. Passwords are never shown.
              </DialogDescription>
            </DialogHeader>
            <dl className="grid gap-3 rounded-2xl bg-muted/50 p-4 sm:grid-cols-2">
              <div>
                <dt className="text-[10px] uppercase text-muted-foreground">
                  Name
                </dt>
                <dd className="mt-1 text-sm font-medium">{viewing.name}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase text-muted-foreground">
                  Email
                </dt>
                <dd className="mt-1 text-sm font-medium">{viewing.email}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase text-muted-foreground">
                  Role
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  {roleLabel(viewing.roleId)}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase text-muted-foreground">
                  Status
                </dt>
                <dd className="mt-1">
                  <StatusBadge status={viewing.status} />
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase text-muted-foreground">
                  Department
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  {viewing.department}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase text-muted-foreground">
                  Designation
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  {viewing.designation}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase text-muted-foreground">
                  Created
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  {formatCompactDate(viewing.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase text-muted-foreground">
                  Last login
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  {formatCompactDate(viewing.lastLoginAt)}
                </dd>
              </div>
            </dl>
            <div>
              <p className="mb-2 text-[10px] font-medium uppercase text-muted-foreground">
                Module access
              </p>
              <ul className="max-h-40 space-y-1 overflow-auto text-xs">
                {viewing.permissions.map((entry) => (
                  <li
                    key={entry.moduleId}
                    className="rounded-lg border border-border/70 px-2.5 py-1.5"
                  >
                    <span className="font-medium">
                      {MODULE_REGISTRY.find(
                        (module) => module.id === entry.moduleId,
                      )?.label ?? entry.moduleId}
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {entry.actions.join(", ")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setViewing(null)}
              >
                Close
              </Button>
              <Button
                className="rounded-xl bg-[#2F6BFF] hover:bg-[#2558d9]"
                onClick={() => {
                  setEditing(viewing);
                  setViewing(null);
                  setOpen(true);
                }}
              >
                <UserRound className="h-4 w-4" /> Edit user
              </Button>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>

      <Dialog
        open={resetTarget !== null}
        onOpenChange={(next) => {
          if (!next) setResetTarget(null);
        }}
      >
        {resetTarget ? (
          <DialogContent className="rounded-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reset demo password</DialogTitle>
              <DialogDescription>
                Set a temporary password for {resetTarget.email}. Do not use
                real employee credentials.
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-3"
              onSubmit={async (event) => {
                event.preventDefault();
                if (resetPassword.length < 6) {
                  notify.warning("Password must be at least 6 characters.");
                  return;
                }
                if (resetPassword !== resetConfirm) {
                  notify.warning("Password confirmation does not match.");
                  return;
                }
                try {
                  await resetUserDemoPassword(resetTarget.id, resetPassword);
                  recordAndToast({
                    module: "admin-access",
                    eventType: "user.password_reset",
                    title: "Demo password updated",
                    description: `Temporary password set for ${resetTarget.email}.`,
                    severity: "warning",
                    operationStatus: "succeeded",
                    relatedRecordId: resetTarget.id,
                    relatedRoute: "/settings/admin-access",
                    recipientUserId: resetTarget.id,
                    idempotencyKey: `user-pw-${resetTarget.id}-${Date.now()}`,
                  });
                  setResetTarget(null);
                } catch (error) {
                  notify.error(
                    error instanceof Error
                      ? error.message
                      : "Unable to reset password.",
                  );
                }
              }}
            >
              <FormField label="Temporary password" required>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={resetPassword}
                  onChange={(event) => setResetPassword(event.target.value)}
                  className="rounded-xl"
                  required
                />
              </FormField>
              <FormField label="Confirm password" required>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={resetConfirm}
                  onChange={(event) => setResetConfirm(event.target.value)}
                  className="rounded-xl"
                  required
                />
              </FormField>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setResetTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl bg-[#2F6BFF] hover:bg-[#2558d9]"
                >
                  Update password
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        ) : null}
      </Dialog>

      {confirmDialog}
    </AppShell>
  );
}

function UserFormDialog({
  open,
  editing,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  editing: AuthUser | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("General");
  const [designation, setDesignation] = useState("");
  const [roleId, setRoleId] = useState<RoleId>("employee");
  const [status, setStatus] = useState<AccountStatus>("Active");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [permissions, setPermissions] =
    useState<ModulePermission[]>(emptyPermissions());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setEmail(editing.email);
      setPhone(editing.phone ?? "");
      setDepartment(editing.department);
      setDesignation(editing.designation);
      setRoleId(editing.roleId);
      setStatus(editing.status);
      setPermissions(
        editing.permissions.map((entry) => ({
          moduleId: entry.moduleId,
          actions: [...entry.actions],
        })),
      );
      setPassword("");
      setConfirm("");
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setDepartment("General");
      setDesignation("");
      setRoleId("employee");
      setStatus("Active");
      setPermissions(defaultPermissionsForRole("employee"));
      setPassword("");
      setConfirm("");
    }
  }, [editing, open]);

  const permissionMap = useMemo(() => {
    const map = new Map<ModuleId, Set<ActionId>>();
    permissions.forEach((entry) => {
      map.set(entry.moduleId, new Set(entry.actions));
    });
    return map;
  }, [permissions]);

  const toggleModule = (moduleId: ModuleId, enabled: boolean) => {
    const def = MODULE_REGISTRY.find((entry) => entry.id === moduleId);
    if (!def) return;
    setPermissions((current) => {
      const next = current.filter((entry) => entry.moduleId !== moduleId);
      if (enabled) {
        next.push({ moduleId, actions: [...def.actions] });
      }
      return next;
    });
  };

  const toggleAction = (
    moduleId: ModuleId,
    action: ActionId,
    enabled: boolean,
  ) => {
    const def = MODULE_REGISTRY.find((entry) => entry.id === moduleId);
    if (!def) return;
    setPermissions((current) => {
      const existing = current.find((entry) => entry.moduleId === moduleId);
      const actions = new Set(existing?.actions ?? ["view"]);
      if (enabled) {
        actions.add("view");
        actions.add(action);
      } else {
        actions.delete(action);
        if (action === "view") actions.clear();
      }
      const filtered = current.filter((entry) => entry.moduleId !== moduleId);
      if (actions.size > 0) {
        filtered.push({
          moduleId,
          actions: def.actions.filter((item) => actions.has(item)),
        });
      }
      return filtered;
    });
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing && password !== confirm) {
      notify.warning("Password confirmation does not match.");
      return;
    }
    if (editing && password && password !== confirm) {
      notify.warning("Password confirmation does not match.");
      return;
    }
    setBusy(true);
    try {
      const payload: Parameters<typeof upsertAuthUser>[0] = {
        name,
        email,
        phone,
        department,
        designation,
        roleId,
        status,
        permissions,
      };
      if (editing?.id) payload.id = editing.id;
      if (password) payload.temporaryPassword = password;
      await upsertAuthUser(payload);
      recordAndToast({
        module: "admin-access",
        eventType: editing ? "user.updated" : "user.created",
        title: editing ? "User updated" : "User created",
        description: email,
        severity: "success",
        operationStatus: "succeeded",
        relatedRoute: "/settings/admin-access",
        idempotencyKey: `user-save-${email}-${Date.now()}`,
      });
      onSaved();
    } catch (error) {
      notify.error(
        error instanceof Error ? error.message : "Unable to save user.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit user" : "Add user"}</DialogTitle>
          <DialogDescription>
            Assign a role template or customize module permissions. Passwords
            are hashed for this demo and never shown in tables.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Full name" required>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Email address" required>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Phone number">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </FormField>
            <FormField label="Department" required>
              <Input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Designation" required>
              <Input
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Role" required>
              <Select
                value={roleId}
                onValueChange={(value) => {
                  const next = value as RoleId;
                  setRoleId(next);
                  setPermissions(defaultPermissionsForRole(next));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_TEMPLATES.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Account status" required>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as AccountStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              label={
                editing ? "Temporary password (optional)" : "Temporary password"
              }
              required={!editing}
            >
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!editing}
              />
            </FormField>
            <FormField
              label="Confirm password"
              required={!editing || Boolean(password)}
            >
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required={!editing || Boolean(password)}
              />
            </FormField>
          </div>

          <div className="space-y-2 rounded-xl border border-border p-3">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setPermissions(
                    MODULE_REGISTRY.map((module) => ({
                      moduleId: module.id,
                      actions: [...module.actions],
                    })),
                  )
                }
              >
                Select All
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPermissions([])}
              >
                Clear All
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setPermissions(defaultPermissionsForRole(roleId))
                }
              >
                Reset to role defaults
              </Button>
            </div>
            <div className="max-h-64 space-y-2 overflow-auto">
              {MODULE_REGISTRY.map((module) => {
                const selected = permissionMap.get(module.id);
                const moduleOn = Boolean(selected?.size);
                return (
                  <div
                    key={module.id}
                    className="rounded-lg border border-border/70 px-3 py-2"
                  >
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={moduleOn}
                        onChange={(event) =>
                          toggleModule(module.id, event.target.checked)
                        }
                      />
                      {module.label}
                    </label>
                    {moduleOn ? (
                      <div className="mt-2 flex flex-wrap gap-2 pl-6 text-xs">
                        {module.actions.map((action) => (
                          <label
                            key={action}
                            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1"
                          >
                            <input
                              type="checkbox"
                              checked={selected?.has(action) ?? false}
                              onChange={(event) =>
                                toggleAction(
                                  module.id,
                                  action,
                                  event.target.checked,
                                )
                              }
                            />
                            {action}
                          </label>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
