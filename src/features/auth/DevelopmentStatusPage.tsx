import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock3,
  LayoutGrid,
  Sparkles,
  Target,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { Textarea } from "@/components/ui/textarea";
import {
  computeDevProgress,
  computeRoadmapProgress,
  listDevFeatures,
  PRODUCT_DIFFERENTIATORS,
  ROADMAP_PHASES,
  subscribeDevRegistry,
  updateDevFeature,
  type DevFeature,
  type DevStatus,
  type TestingStatus,
} from "@/features/auth/devRegistry";
import { useAuth } from "@/features/auth/useAuth";
import {
  ACTION_ICONS,
  AppShell,
  FormField,
  MetricCard,
  MetricGrid,
  PageHeader,
  RowActionsBar,
  TABLE_ACTION_CELL_CLASS,
  TABLE_CELL_CLASS,
  TABLE_HEAD_CLASS,
  TABLE_ROW_CLASS,
  TruncateWithTooltip,
  formatCompactDate,
} from "@/features/crm/shared";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<DevStatus, string> = {
  implemented: "bg-emerald-100 text-emerald-800",
  "in-progress": "bg-sky-100 text-sky-800",
  pending: "bg-amber-100 text-amber-800",
  blocked: "bg-red-100 text-red-800",
  upcoming: "bg-slate-100 text-slate-700",
};

const STATUS_LABEL: Record<DevStatus, string> = {
  implemented: "Implemented",
  "in-progress": "In Progress",
  pending: "Pending",
  blocked: "Blocked",
  upcoming: "Upcoming",
};

const TESTING_LABEL: Record<TestingStatus, string> = {
  "not-started": "Not Started",
  "unit-covered": "Unit Covered",
  "manual-pending": "Manual Pending",
  verified: "Verified",
};

const PRIORITY_STYLE: Record<DevFeature["priority"], string> = {
  P0: "bg-red-50 text-red-700",
  P1: "bg-amber-50 text-amber-800",
  P2: "bg-sky-50 text-sky-800",
  P3: "bg-slate-100 text-slate-700",
};

export function DevelopmentStatusPage() {
  const { can } = useAuth();
  const canEdit = can("development-status", "edit");
  const [features, setFeatures] = useState<DevFeature[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [roadmapQuery, setRoadmapQuery] = useState("");
  const [roadmapStatus, setRoadmapStatus] = useState("all");
  const [roadmapPriority, setRoadmapPriority] = useState("all");
  const [roadmapPhase, setRoadmapPhase] = useState("all");
  const [openPhases, setOpenPhases] = useState<Record<string, boolean>>({
    [ROADMAP_PHASES[0]]: true,
  });
  const [viewing, setViewing] = useState<DevFeature | null>(null);
  const [editing, setEditing] = useState<DevFeature | null>(null);

  const refresh = () => setFeatures(listDevFeatures());

  useEffect(() => {
    refresh();
    return subscribeDevRegistry(refresh);
  }, []);

  const currentFeatures = useMemo(
    () => features.filter((feature) => feature.track === "current"),
    [features],
  );
  const roadmapFeatures = useMemo(
    () => features.filter((feature) => feature.track === "roadmap"),
    [features],
  );
  const progress = computeDevProgress(features);
  const roadmapProgress = computeRoadmapProgress(features);
  const phases = useMemo(
    () => [...new Set(currentFeatures.map((feature) => feature.phase))],
    [currentFeatures],
  );

  const filteredCurrent = currentFeatures.filter((feature) => {
    const haystack =
      `${feature.name} ${feature.description} ${feature.notes}`.toLowerCase();
    return (
      (!query.trim() || haystack.includes(query.trim().toLowerCase())) &&
      (statusFilter === "all" || feature.status === statusFilter) &&
      (phaseFilter === "all" || feature.phase === phaseFilter) &&
      (priorityFilter === "all" || feature.priority === priorityFilter)
    );
  });

  const filteredRoadmap = roadmapFeatures.filter((feature) => {
    const haystack =
      `${feature.name} ${feature.description} ${feature.businessValue} ${feature.notes}`.toLowerCase();
    return (
      (!roadmapQuery.trim() ||
        haystack.includes(roadmapQuery.trim().toLowerCase())) &&
      (roadmapStatus === "all" || feature.status === roadmapStatus) &&
      (roadmapPriority === "all" || feature.priority === roadmapPriority) &&
      (roadmapPhase === "all" || feature.phase === roadmapPhase)
    );
  });

  const openEdit = (feature: DevFeature) => {
    if (!canEdit) {
      toast("Only Super Admin editors can update development records.");
      return;
    }
    setEditing(feature);
  };

  return (
    <AppShell>
      <PageHeader
        title="Development Status"
        description="Current implementation progress and the future Yaglob AI-powered CRM, ERP, billing, and automation roadmap."
        actions={
          <Button asChild variant="outline" size="sm" className="rounded-xl">
            <Link to="/settings/admin-access">Admin Access</Link>
          </Button>
        }
      />

      <MetricGrid>
        <MetricCard
          icon={<LayoutGrid className="h-4 w-4" />}
          label="Current features"
          value={String(progress.total)}
        />
        <MetricCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Implemented"
          value={String(progress.implemented)}
        />
        <MetricCard
          icon={<Activity className="h-4 w-4" />}
          label="In progress"
          value={String(progress.inProgress)}
        />
        <MetricCard
          icon={<Clock3 className="h-4 w-4" />}
          label="Pending"
          value={String(progress.pending)}
        />
        <MetricCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Blocked"
          value={String(progress.blocked)}
        />
        <MetricCard
          icon={<Sparkles className="h-4 w-4" />}
          label="Roadmap items"
          value={String(roadmapProgress.total)}
        />
      </MetricGrid>

      <div className="crm-card crm-card--blue mb-5 p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">
            Current implementation progress
          </p>
          <p className="text-sm font-bold tabular-nums text-[#2F6BFF]">
            {progress.percentage}%
          </p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-[#43A980]"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Percentage = implemented ÷ current tracked features. Future roadmap
          items are tracked separately and do not reduce this score.
        </p>
      </div>

      <section className="crm-card mb-8">
        <div className="border-b border-border/80 px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            Current development registry
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Implemented, pending, in-progress, and blocked work already in the
            product. WhatsApp/Email delivery remains blocked until connectors
            are configured.
          </p>
        </div>
        <div className="grid gap-2 border-b border-border/80 px-3 py-3 sm:grid-cols-4 sm:px-4">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search current features…"
            className="h-9 rounded-xl"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 rounded-xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="implemented">Implemented</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
            </SelectContent>
          </Select>
          <Select value={phaseFilter} onValueChange={setPhaseFilter}>
            <SelectTrigger className="h-9 rounded-xl">
              <SelectValue placeholder="Phase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All phases</SelectItem>
              {phases.map((phase) => (
                <SelectItem key={phase} value={phase}>
                  {phase}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-9 rounded-xl">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {["P0", "P1", "P2", "P3"].map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <FeatureTable
          rows={filteredCurrent}
          canEdit={canEdit}
          onView={setViewing}
          onEdit={openEdit}
          emptyLabel="No current features match your search."
        />
      </section>

      <section className="mb-8 space-y-4">
        <div className="crm-card crm-card--blue p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="mb-1 inline-flex items-center gap-2 text-[#2F6BFF]">
                <Bot className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  Advanced Features & Future Roadmap
                </span>
              </div>
              <h2 className="text-base font-semibold text-foreground">
                AI-powered CRM, ERP, billing, and business automation
              </h2>
              <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
                Vision documentation only. Items below start as Upcoming unless
                repository evidence shows work has begun. No fake completion, AI
                outputs, or live integrations are claimed here.
              </p>
            </div>
            <div className="rounded-xl border border-[#D7E4FF] bg-white/80 px-3 py-2 text-right shadow-sm">
              <p className="text-[10px] uppercase text-muted-foreground">
                Roadmap features
              </p>
              <p className="text-lg font-bold tabular-nums text-[#2F6BFF]">
                {roadmapProgress.total}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {roadmapProgress.upcoming} upcoming
              </p>
            </div>
          </div>
        </div>

        <div className="crm-card grid gap-2 p-3 sm:grid-cols-4">
          <Input
            value={roadmapQuery}
            onChange={(event) => setRoadmapQuery(event.target.value)}
            placeholder="Search roadmap…"
            className="h-9 rounded-xl"
          />
          <Select value={roadmapStatus} onValueChange={setRoadmapStatus}>
            <SelectTrigger className="h-9 rounded-xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
              <SelectItem value="implemented">Implemented</SelectItem>
            </SelectContent>
          </Select>
          <Select value={roadmapPhase} onValueChange={setRoadmapPhase}>
            <SelectTrigger className="h-9 rounded-xl">
              <SelectValue placeholder="Phase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roadmap phases</SelectItem>
              {ROADMAP_PHASES.map((phase) => (
                <SelectItem key={phase} value={phase}>
                  {phase}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={roadmapPriority} onValueChange={setRoadmapPriority}>
            <SelectTrigger className="h-9 rounded-xl">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {["P0", "P1", "P2", "P3"].map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border border-dashed border-[#D7E4FF] bg-[#F8FBFF] px-3 py-2 text-xs text-muted-foreground">
          Phase 2 delivery automation continues from the existing blocked
          WhatsApp / Email delivery feature in the current registry, so those
          capabilities are not duplicated below.
        </div>

        <div className="space-y-3">
          {ROADMAP_PHASES.map((phase, index) => {
            const phaseRows = filteredRoadmap.filter(
              (feature) => feature.phase === phase,
            );
            const stats = roadmapProgress.byPhase[index];
            const open = openPhases[phase] ?? false;
            if (roadmapPhase !== "all" && roadmapPhase !== phase) return null;
            return (
              <Collapsible
                key={phase}
                open={open}
                onOpenChange={(next) =>
                  setOpenPhases((current) => ({ ...current, [phase]: next }))
                }
              >
                <div className="crm-card">
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-muted/30"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {phase}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {stats?.total ?? phaseRows.length} features ·{" "}
                          {stats?.upcoming ?? 0} upcoming
                        </p>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                          open && "rotate-180",
                        )}
                      />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <FeatureTable
                      rows={phaseRows}
                      canEdit={canEdit}
                      onView={setViewing}
                      onEdit={openEdit}
                      emptyLabel="No roadmap features match these filters."
                      showBusinessValue
                    />
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      </section>

      <section className="crm-card crm-card--lavender mb-6">
        <div className="border-b border-border/80 px-4 py-4 sm:px-5">
          <div className="mb-1 inline-flex items-center gap-2 text-[#2F6BFF]">
            <Target className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Product Differentiation
            </span>
          </div>
          <h2 className="text-base font-semibold text-foreground">
            Future competitive advantages
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Planned capabilities and the business value they are intended to
            create. This is product vision, not a claim about competitors.
          </p>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 sm:p-5">
          {PRODUCT_DIFFERENTIATORS.map((item, index) => (
            <article key={item.id} className="crm-card p-3.5">
              <p className="text-[11px] font-semibold tabular-nums text-[#2F6BFF]">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-1 text-sm font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                {item.businessValue}
              </p>
            </article>
          ))}
        </div>
      </section>

      <Dialog
        open={viewing !== null}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
      >
        {viewing ? (
          <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{viewing.name}</DialogTitle>
              <DialogDescription>{viewing.description}</DialogDescription>
            </DialogHeader>
            <dl className="grid gap-3 rounded-2xl bg-muted/50 p-4 sm:grid-cols-2">
              <div>
                <dt className="text-[10px] uppercase text-muted-foreground">
                  Status
                </dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[viewing.status]}`}
                  >
                    {STATUS_LABEL[viewing.status]}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase text-muted-foreground">
                  Testing
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  {TESTING_LABEL[viewing.testingStatus]}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase text-muted-foreground">
                  Priority
                </dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${PRIORITY_STYLE[viewing.priority]}`}
                  >
                    {viewing.priority}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase text-muted-foreground">
                  Track
                </dt>
                <dd className="mt-1 text-sm font-medium capitalize">
                  {viewing.track}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[10px] uppercase text-muted-foreground">
                  Development phase
                </dt>
                <dd className="mt-1 text-sm font-medium">{viewing.phase}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[10px] uppercase text-muted-foreground">
                  Last updated
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  {formatCompactDate(viewing.lastUpdated)}
                </dd>
              </div>
            </dl>
            <section className="space-y-3 text-sm">
              <div>
                <p className="text-[10px] font-medium uppercase text-muted-foreground">
                  Business value
                </p>
                <p className="mt-1 text-muted-foreground">
                  {viewing.businessValue || "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase text-muted-foreground">
                  Technical dependencies
                </p>
                <p className="mt-1 text-muted-foreground">
                  {viewing.dependencies || "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase text-muted-foreground">
                  Administrator notes
                </p>
                <p className="mt-1 text-muted-foreground">
                  {viewing.notes || "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase text-muted-foreground">
                  Known limitations
                </p>
                <p className="mt-1 text-muted-foreground">
                  {viewing.limitations || "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase text-muted-foreground">
                  Next action
                </p>
                <p className="mt-1 text-muted-foreground">
                  {viewing.nextAction || "—"}
                </p>
              </div>
            </section>
            <DialogFooter>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setViewing(null)}
              >
                Close
              </Button>
              {canEdit ? (
                <Button
                  className="rounded-xl bg-[#2F6BFF] hover:bg-[#2558d9]"
                  onClick={() => {
                    setEditing(viewing);
                    setViewing(null);
                  }}
                >
                  Edit feature
                </Button>
              ) : null}
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>

      <FeatureEditDialog
        feature={editing}
        canEdit={canEdit}
        onClose={() => setEditing(null)}
        onSaved={() => {
          refresh();
          setEditing(null);
        }}
      />
    </AppShell>
  );
}

function FeatureTable({
  rows,
  canEdit,
  onView,
  onEdit,
  emptyLabel,
  showBusinessValue = false,
}: {
  rows: DevFeature[];
  canEdit: boolean;
  onView: (feature: DevFeature) => void;
  onEdit: (feature: DevFeature) => void;
  emptyLabel: string;
  showBusinessValue?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] border-collapse text-left text-sm">
        <thead className="bg-muted/40">
          <tr>
            <th className={TABLE_HEAD_CLASS}>Feature</th>
            <th className={TABLE_HEAD_CLASS}>Phase</th>
            <th className={TABLE_HEAD_CLASS}>Status</th>
            <th className={TABLE_HEAD_CLASS}>Priority</th>
            {showBusinessValue ? (
              <th className={TABLE_HEAD_CLASS}>Business value</th>
            ) : (
              <th className={TABLE_HEAD_CLASS}>Testing</th>
            )}
            <th className={TABLE_HEAD_CLASS}>Updated</th>
            <th className={`${TABLE_HEAD_CLASS} text-right`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((feature) => (
            <tr key={feature.id} className={TABLE_ROW_CLASS}>
              <td className={TABLE_CELL_CLASS}>
                <TruncateWithTooltip
                  value={feature.name}
                  className="max-w-[220px] font-semibold text-foreground"
                />
              </td>
              <td className={`${TABLE_CELL_CLASS} text-muted-foreground`}>
                <TruncateWithTooltip
                  value={feature.phase}
                  className="max-w-[180px]"
                />
              </td>
              <td className={TABLE_CELL_CLASS}>
                <span
                  className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[feature.status]}`}
                >
                  {STATUS_LABEL[feature.status]}
                </span>
              </td>
              <td className={TABLE_CELL_CLASS}>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${PRIORITY_STYLE[feature.priority]}`}
                >
                  {feature.priority}
                </span>
              </td>
              <td className={`${TABLE_CELL_CLASS} text-muted-foreground`}>
                {showBusinessValue ? (
                  <TruncateWithTooltip
                    value={feature.businessValue || "—"}
                    className="max-w-[240px]"
                  />
                ) : (
                  TESTING_LABEL[feature.testingStatus]
                )}
              </td>
              <td className={`${TABLE_CELL_CLASS} text-muted-foreground`}>
                {formatCompactDate(feature.lastUpdated)}
              </td>
              <td className={TABLE_ACTION_CELL_CLASS}>
                <RowActionsBar
                  primary={[
                    {
                      id: "view",
                      label: "View details",
                      icon: ACTION_ICONS.view,
                      onClick: () => onView(feature),
                    },
                    ...(canEdit
                      ? [
                          {
                            id: "edit",
                            label: "Edit feature",
                            icon: ACTION_ICONS.edit,
                            onClick: () => onEdit(feature),
                          },
                        ]
                      : []),
                  ]}
                />
              </td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="px-4 py-12 text-center text-sm text-muted-foreground"
              >
                {emptyLabel}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

function FeatureEditDialog({
  feature,
  canEdit,
  onClose,
  onSaved,
}: {
  feature: DevFeature | null;
  canEdit: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<DevStatus>("pending");
  const [testingStatus, setTestingStatus] =
    useState<TestingStatus>("not-started");
  const [priority, setPriority] = useState<DevFeature["priority"]>("P1");
  const [notes, setNotes] = useState("");
  const [limitations, setLimitations] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [businessValue, setBusinessValue] = useState("");
  const [dependencies, setDependencies] = useState("");

  useEffect(() => {
    if (!feature) return;
    setStatus(feature.status);
    setTestingStatus(feature.testingStatus);
    setPriority(feature.priority);
    setNotes(feature.notes);
    setLimitations(feature.limitations);
    setNextAction(feature.nextAction);
    setBusinessValue(feature.businessValue);
    setDependencies(feature.dependencies);
  }, [feature]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!feature || !canEdit) return;
    updateDevFeature(feature.id, {
      status,
      testingStatus,
      priority,
      notes,
      limitations,
      nextAction,
      businessValue,
      dependencies,
    });
    toast("Feature updated.");
    onSaved();
  };

  return (
    <Dialog
      open={feature !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {feature ? (
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit feature</DialogTitle>
            <DialogDescription>{feature.name}</DialogDescription>
          </DialogHeader>
          <form className="space-y-3" onSubmit={onSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Implementation status" required>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as DevStatus)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABEL) as DevStatus[]).map((item) => (
                      <SelectItem key={item} value={item}>
                        {STATUS_LABEL[item]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Testing status" required>
                <Select
                  value={testingStatus}
                  onValueChange={(value) =>
                    setTestingStatus(value as TestingStatus)
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TESTING_LABEL) as TestingStatus[]).map(
                      (item) => (
                        <SelectItem key={item} value={item}>
                          {TESTING_LABEL[item]}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <FormField label="Priority" required>
              <Select
                value={priority}
                onValueChange={(value) =>
                  setPriority(value as DevFeature["priority"])
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["P0", "P1", "P2", "P3"] as const).map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Business value">
              <Textarea
                value={businessValue}
                onChange={(event) => setBusinessValue(event.target.value)}
                className="min-h-20 rounded-xl"
              />
            </FormField>
            <FormField label="Technical dependencies">
              <Textarea
                value={dependencies}
                onChange={(event) => setDependencies(event.target.value)}
                className="min-h-20 rounded-xl"
              />
            </FormField>
            <FormField label="Administrator notes">
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="min-h-20 rounded-xl"
              />
            </FormField>
            <FormField label="Known limitations">
              <Textarea
                value={limitations}
                onChange={(event) => setLimitations(event.target.value)}
                className="min-h-20 rounded-xl"
              />
            </FormField>
            <FormField label="Next action">
              <Input
                value={nextAction}
                onChange={(event) => setNextAction(event.target.value)}
                className="rounded-xl"
              />
            </FormField>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl bg-[#2F6BFF] hover:bg-[#2558d9]"
                disabled={!canEdit}
              >
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
