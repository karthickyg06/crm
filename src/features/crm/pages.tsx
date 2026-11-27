import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  BriefcaseBusiness,
  AlertCircle,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Ellipsis,
  FileText,
  Filter,
  Globe,
  LayoutGrid,
  List,
  Megaphone,
  Package,
  Phone,
  Plus,
  RefreshCcw,
  Search,
  Settings2,
  Share2,
  ShoppingBag,
  Sparkles,
  UsersRound,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { notify, recordAndToast } from "@/features/notifications/notify";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  customerGrowth,
  customerIndustries,
  customerMetricSparks,
  customerStatuses,
  dealBoardStages,
  dealFunnel,
  dealGauges,
  dealKpiRings,
  dealMetricSpark,
  dealStageBars,
  dealValueTrend,
  dealWinRate,
  leadFunnel,
  leadMetricSparks,
  leadSources,
  leadTrend,
  type Customer,
  type Deal,
  type Invoice,
  type Lead,
} from "@/features/crm/data";
import {
  convertLeadToCustomer,
  ensureDemoBootstrapped,
  listInvoiceIndex,
  listPayments,
  listQuotations,
  loadCustomers,
  loadDeals,
  loadLeads,
  recomputeCustomerOutstanding,
  resetDemoData,
  saveCustomers,
  saveDeals,
  saveLeads,
  upsertInvoiceIndex,
} from "@/features/erp/demoStore";
import { ensureSeedInvoiceSnapshots } from "@/features/erp/ensureInvoiceSnapshots";
import {
  listPaymentsForInvoice,
  recordInvoicePayment,
} from "@/features/erp/paymentService";
import {
  downloadPaymentReceipt,
  printPaymentReceipt,
} from "@/features/erp/receiptService";
import { useAuth } from "@/features/auth/useAuth";
import {
  computeDashboardMetrics,
  computeInvoiceSummary,
  formatLakhTick,
  type RevenueGranularity,
} from "@/features/erp/selectors";
import {
  ImportExportToolbar,
  customersImportConfig,
  leadsImportConfig,
} from "@/features/crm/importExport";
import {
  ACTION_ICONS,
  ActionIconButton,
  AppShell,
  currency,
  DataTable,
  type DataColumn,
  FormField,
  initials,
  MetricCard,
  MetricGrid,
  PageHeader,
  Panel,
  RowActions,
  StatusBadge,
  SummaryCard,
} from "@/features/crm/shared";
import { InvoiceForm } from "@/features/invoices/components/InvoiceForm";
import { InvoicePreview } from "@/features/invoices/components/InvoicePreview";
import { InvoiceSettingsPanel } from "@/features/invoices/components/InvoiceSettingsPanel";
import { InvoiceSuccessDialog } from "@/features/invoices/components/InvoiceSuccessDialog";
import { PrintDialog } from "@/features/invoices/components/PrintDialog";
import { TemplateSelector } from "@/features/invoices/components/TemplateSelector";
import { persistInvoiceTemplateChoice } from "@/features/invoices/services/issueService";
import {
  loadOrgInvoicePreferences,
  updateOrgInvoicePreferences,
} from "@/features/invoices/services/orgPrefsStore";
import { downloadInvoicePdf } from "@/features/invoices/services/pdfService";
import {
  getInvoiceSnapshot,
  listInvoiceSnapshots,
} from "@/features/invoices/services/snapshotStore";
import type {
  DeliveryJob,
  InvoiceDocumentModel,
  IssuedInvoiceResult,
} from "@/features/invoices/types/invoice.types";
import { cn } from "@/lib/utils";

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-medium uppercase text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 break-words text-xs font-medium">{value || "—"}</dd>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <h3 className="mb-3 text-xs font-semibold">{children}</h3>;
}

function NameLink({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <Button
      variant="link"
      size="sm"
      className="h-auto max-w-full justify-start px-0 py-0 text-left text-xs font-medium text-foreground"
      onClick={onClick}
    >
      {name}
    </Button>
  );
}

function DashboardActions() {
  const { can } = useAuth();
  const quickAdds = [
    can("leads", "create") ? (
      <DropdownMenuItem key="lead" asChild>
        <Link to="/leads">Add lead</Link>
      </DropdownMenuItem>
    ) : null,
    can("customers", "create") ? (
      <DropdownMenuItem key="customer" asChild>
        <Link to="/customers">Add customer</Link>
      </DropdownMenuItem>
    ) : null,
    can("deals", "create") ? (
      <DropdownMenuItem key="deal" asChild>
        <Link to="/deals">Add deal</Link>
      </DropdownMenuItem>
    ) : null,
    can("invoices", "create") ? (
      <DropdownMenuItem key="invoice" asChild>
        <Link to="/invoices">Create invoice</Link>
      </DropdownMenuItem>
    ) : null,
  ].filter(Boolean);

  return (
    <div className="flex items-center gap-2">
      <Select defaultValue="30-days">
        <SelectTrigger className="h-8 w-[132px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7-days">Last 7 days</SelectItem>
          <SelectItem value="30-days">Last 30 days</SelectItem>
          <SelectItem value="quarter">This quarter</SelectItem>
        </SelectContent>
      </Select>
      {quickAdds.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="h-8 px-2.5 sm:px-3">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Quick add</span>
              <ChevronDown className="hidden h-3.5 w-3.5 sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {quickAdds}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}

export function DashboardPage() {
  ensureDemoBootstrapped();
  ensureSeedInvoiceSnapshots();
  const { can } = useAuth();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [granularity, setGranularity] = useState<RevenueGranularity>("month");
  const metrics = computeDashboardMetrics({
    year: selectedYear,
    granularity,
  });
  const yearOptions = metrics.availableYears.length
    ? metrics.availableYears
    : [currentYear, currentYear - 1];
  const showFinance = can("invoices", "view") || can("payments", "view");
  const showRevenueChart = can("invoices", "view") || can("payments", "view");
  const showCollections = can("payments", "view") || can("invoices", "view");
  const showRecentInvoices = can("invoices", "view");

  const salesColumns: DataColumn<(typeof metrics.recentInvoices)[number]>[] = [
    {
      id: "orderId",
      label: "Invoice #",
      render: (row) => (
        <span className="font-semibold text-foreground">{row.orderId}</span>
      ),
    },
    {
      id: "date",
      label: "Date",
      render: (row) => (
        <span className="text-muted-foreground">{row.date}</span>
      ),
    },
    {
      id: "customer",
      label: "Customer Name",
      render: (row) => <span className="font-medium">{row.customer}</span>,
    },
    {
      id: "category",
      label: "Category",
      render: (row) => (
        <span className="text-muted-foreground">{row.category}</span>
      ),
    },
    {
      id: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: "items",
      label: "Items",
      render: (row) => <span className="tabular-nums">{row.items}</span>,
    },
    {
      id: "total",
      label: "Total",
      render: (row) => (
        <span className="font-semibold tabular-nums">
          {currency(row.total)}
        </span>
      ),
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Welcome back,"
        description="Live totals from invoices, payments, and customers"
        actions={<DashboardActions />}
      />

      <MetricGrid>
        {can("invoices", "view") ? (
          <MetricCard
            icon={<ShoppingBag className="h-4 w-4" />}
            label="Invoice count (All Time)"
            value={String(metrics.invoiceCount)}
            change="0%"
          />
        ) : null}
        {can("customers", "view") ? (
          <MetricCard
            icon={<UsersRound className="h-4 w-4" />}
            label="Total Customers (All Time)"
            value={String(metrics.customerCount)}
            change="0%"
          />
        ) : null}
        {showFinance ? (
          <MetricCard
            icon={<CircleDollarSign className="h-4 w-4" />}
            label="Total sales (All Time)"
            value={currency(metrics.totalSales)}
            change="0%"
          />
        ) : null}
        {can("payments", "view") ? (
          <MetricCard
            icon={<RefreshCcw className="h-4 w-4" />}
            label="Payments received (All Time)"
            value={currency(metrics.paymentsReceived)}
            change="0%"
          />
        ) : null}
        {showFinance ? (
          <MetricCard
            icon={<CircleDollarSign className="h-4 w-4" />}
            label="Outstanding (All Time)"
            value={currency(metrics.outstanding)}
            change="0%"
          />
        ) : null}
        {can("leads", "view") ? (
          <MetricCard
            icon={<UsersRound className="h-4 w-4" />}
            label="Total leads (All Time)"
            value={String(metrics.leadCount)}
            change="0%"
          />
        ) : null}
        {can("deals", "view") ? (
          <MetricCard
            icon={<ShoppingBag className="h-4 w-4" />}
            label="Open deals (All Time)"
            value={String(metrics.openDealCount)}
            change="0%"
          />
        ) : null}
        {can("inventory", "view") || can("products", "view") ? (
          <MetricCard
            icon={<Package className="h-4 w-4" />}
            label="Low stock SKUs (All Time)"
            value={String(metrics.lowStockCount)}
            change="0%"
          />
        ) : null}
      </MetricGrid>

      {showRevenueChart || showCollections ? (
        <div className="mb-5 grid min-w-0 gap-5 sm:gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)]">
          {showRevenueChart ? (
            <Panel
              title="Revenue Insights"
              action={
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <div className="flex rounded-full border border-border bg-card p-0.5">
                    <Button
                      type="button"
                      size="sm"
                      variant={
                        selectedYear === currentYear ? "default" : "ghost"
                      }
                      className="h-7 rounded-full px-2.5 text-[11px]"
                      onClick={() => setSelectedYear(currentYear)}
                    >
                      This Year
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={
                        selectedYear === currentYear - 1 ? "default" : "ghost"
                      }
                      className="h-7 rounded-full px-2.5 text-[11px]"
                      onClick={() => setSelectedYear(currentYear - 1)}
                    >
                      Last Year
                    </Button>
                  </div>
                  <Select
                    value={String(selectedYear)}
                    onValueChange={(value) => setSelectedYear(Number(value))}
                  >
                    <SelectTrigger className="h-8 w-[92px] rounded-full border-border text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={granularity}
                    onValueChange={(value) =>
                      setGranularity(value as RevenueGranularity)
                    }
                  >
                    <SelectTrigger className="h-8 w-[110px] rounded-full border-border text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Monthly</SelectItem>
                      <SelectItem value="quarter">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              }
            >
              <p className="mb-2 text-xs text-muted-foreground">
                Reporting period: {metrics.periodLabel}
              </p>
              <div className="h-[280px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={metrics.revenueSeries}
                    margin={{ top: 12, right: 8, left: -8, bottom: 0 }}
                    barCategoryGap="18%"
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="var(--border)"
                      strokeDasharray="3 4"
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      tick={{
                        fill: "var(--muted-foreground)",
                        fontSize: granularity === "month" ? 11 : 12,
                        fontFamily: "Plus Jakarta Sans",
                      }}
                      dy={8}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value: number) => formatLakhTick(value)}
                      tick={{
                        fill: "var(--muted-foreground)",
                        fontSize: 11,
                        fontFamily: "Plus Jakarta Sans",
                      }}
                    />
                    <Tooltip
                      cursor={{ fill: "oklch(0.96 0.01 250)" }}
                      formatter={(value, name) => {
                        const amount = Number(value || 0) * 1000;
                        const label =
                          name === "sales" || name === "Sales"
                            ? "Sales"
                            : "Collections";
                        return [
                          new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                            maximumFractionDigits: 0,
                          }).format(amount),
                          label,
                        ];
                      }}
                      contentStyle={{
                        borderRadius: 12,
                        borderColor: "var(--border)",
                        fontSize: 12,
                        fontFamily: "Plus Jakarta Sans",
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
                    />
                    <Bar
                      dataKey="sales"
                      name="Sales"
                      fill="#5685DD"
                      radius={[8, 8, 0, 0]}
                      barSize={granularity === "month" ? 14 : 28}
                    />
                    <Bar
                      dataKey="collections"
                      name="Collections"
                      fill="#43A980"
                      radius={[8, 8, 0, 0]}
                      barSize={granularity === "month" ? 14 : 28}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          ) : null}

          {showCollections ? (
            <Panel
              title="Collections Overview"
              action={<Package className="h-4 w-4 text-muted-foreground" />}
            >
              <p className="mb-1 text-center text-xs text-muted-foreground">
                {metrics.periodLabel}
              </p>
              <div className="relative mx-auto h-[220px] w-full max-w-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.salesGrowth}
                      dataKey="value"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={78}
                      outerRadius={108}
                      paddingAngle={2}
                      stroke="none"
                      cy="70%"
                    >
                      <Cell fill="url(#gaugeFill)" />
                      <Cell fill="#E8EEF3" />
                    </Pie>
                    <defs>
                      <linearGradient
                        id="gaugeFill"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop offset="0%" stopColor="#5685DD" />
                        <stop offset="100%" stopColor="#449EA8" />
                      </linearGradient>
                    </defs>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center">
                  <span className="text-3xl font-bold tracking-tight text-slate-800">
                    {metrics.growthPercent}%
                  </span>
                  <span className="mt-1 text-sm font-medium text-slate-500">
                    Collected vs period sales
                  </span>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {[
                  ["Outstanding (All Time)", currency(metrics.outstanding)],
                  ["Period collections", currency(metrics.periodCollections)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl bg-muted/60 px-3 py-2.5"
                  >
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-1 text-sm font-bold tabular-nums">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
          ) : null}
        </div>
      ) : null}

      {showRecentInvoices ? (
        <>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-base font-bold tracking-tight">
              Recent invoices
            </h2>
            <Link
              to="/invoices"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <DataTable
            rows={metrics.recentInvoices}
            columns={salesColumns}
            compact
            searchPlaceholder="Search recent invoices…"
          />
        </>
      ) : null}
    </AppShell>
  );
}

function LeadSparkline({
  data,
  color,
  id,
}: {
  data: number[];
  color: string;
  id: string;
}) {
  const chartData = data.map((value, index) => ({ index, value }));
  return (
    <div className="h-12 w-[108px] shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.25}
            fill={`url(#${id})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function LeadKpiCard({
  label,
  value,
  change,
  positive = true,
  spark,
  color,
  sparkId,
}: {
  label: string;
  value: string;
  change: string;
  positive?: boolean;
  spark: number[];
  color: string;
  sparkId: string;
}) {
  return (
    <article className="metric-card flex min-h-[148px] min-w-0 flex-col p-[var(--card-pad-kpi)]">
      <p className="truncate text-[13px] font-medium text-slate-600">{label}</p>
      <p
        className="metric-card__value mt-3 text-[22px] font-bold leading-none tracking-tight text-slate-800 sm:text-[26px]"
        title={value}
      >
        {value}
      </p>
      <div className="mt-3 w-full min-w-0 overflow-hidden">
        <LeadSparkline data={spark} color={color} id={sparkId} />
      </div>
      <p
        className={cn(
          "mt-auto pt-3 text-[13px] font-bold",
          positive ? "text-[#43A980]" : "text-[#DF9B60]",
        )}
      >
        {positive ? `+${change}` : change}
        <span className="ml-1 font-normal text-slate-500">vs last month</span>
      </p>
    </article>
  );
}

function buildChevronBand(
  topWidth: number,
  bottomWidth: number,
  height: number,
  centerX: number,
  tip = 9,
) {
  const topLeft = centerX - topWidth / 2;
  const topRight = centerX + topWidth / 2;
  const bottomLeft = centerX - bottomWidth / 2;
  const bottomRight = centerX + bottomWidth / 2;
  const body = Math.max(height - tip, height * 0.72);
  return [
    `M ${topLeft} 0`,
    `L ${topRight} 0`,
    `L ${bottomRight} ${body}`,
    `L ${centerX} ${height}`,
    `L ${bottomLeft} ${body}`,
    "Z",
  ].join(" ");
}

function LeadFunnelChart({ stages }: { stages: typeof leadFunnel }) {
  const total = stages.reduce((sum, stage) => sum + stage.value, 0) || 1;
  const svgWidth = 128;
  const stageHeight = 46;
  const gap = 3;
  const centerX = svgWidth / 2;
  const minWidth = 48;
  const widths = stages.map(
    (_, index) =>
      svgWidth -
      index * ((svgWidth - minWidth) / Math.max(stages.length - 1, 1)),
  );
  const bottomWidths = stages.map((_, index) =>
    index < stages.length - 1 ? widths[index + 1]! : Math.max(minWidth - 8, 40),
  );

  return (
    <div className="lead-funnel" role="img" aria-label="Lead funnel">
      {stages.map((stage, index) => {
        const percent = ((stage.value / total) * 100).toFixed(1);
        const count = stage.value.toLocaleString("en-US");
        const isLast = index === stages.length - 1;
        return (
          <div
            key={stage.name}
            className="lead-funnel__row"
            style={{ height: stageHeight, marginBottom: isLast ? 0 : gap }}
          >
            <div className="lead-funnel__segment">
              <svg
                viewBox={`0 0 ${svgWidth} ${stageHeight}`}
                width="100%"
                height={stageHeight}
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <linearGradient
                    id={`funnel-grad-${index}`}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={stage.fill}
                      stopOpacity="0.88"
                    />
                    <stop offset="100%" stopColor={stage.fill} />
                  </linearGradient>
                </defs>
                <path
                  d={buildChevronBand(
                    widths[index]!,
                    bottomWidths[index]!,
                    stageHeight,
                    centerX,
                  )}
                  fill={`url(#funnel-grad-${index})`}
                />
                <text
                  x={centerX}
                  y={stageHeight / 2}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="12"
                  fontWeight="700"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  {count}
                </text>
              </svg>
            </div>
            <div className="lead-funnel__legend">
              <span className="lead-funnel__step">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="lead-funnel__label">{stage.name}</span>
              <span className="lead-funnel__count">{count}</span>
              <span className="lead-funnel__percent">{percent}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LeadsSourceChart({
  sources,
  total,
}: {
  sources: typeof leadSources;
  total: number;
}) {
  const maxShare = Math.max(...sources.map((source) => source.value), 1);
  return (
    <div className="leads-source">
      <div className="leads-source__summary">
        <span className="leads-source__summary-label">All sources</span>
        <strong className="leads-source__summary-value">
          {total.toLocaleString("en-US")}
        </strong>
      </div>
      <ul className="leads-source__legend">
        {sources.map((source, index) => (
          <li key={source.name} className="leads-source__row">
            <div className="leads-source__meta">
              <span
                className="leads-source__index"
                style={{ color: source.color }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="leads-source__label">{source.name}</span>
              <span className="leads-source__value">{source.value}%</span>
            </div>
            <div className="leads-source__track" aria-hidden>
              <span
                className="leads-source__fill"
                style={{
                  width: `${(source.value / maxShare) * 100}%`,
                  background: `linear-gradient(90deg, ${source.color}aa, ${source.color})`,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LeadTrendChart({ series }: { series: typeof leadTrend }) {
  const peak = series.reduce(
    (best, point) => (point.leads > best.leads ? point : best),
    series[0]!,
  );
  return (
    <div className="leads-trend">
      <div className="leads-trend__peak">
        <span>Peak</span>
        <strong>{peak.leads}</strong>
        <em>{peak.label}</em>
      </div>
      <div className="leads-trend__chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={series}
            margin={{ top: 8, right: 6, left: -18, bottom: 0 }}
          >
            <defs>
              <linearGradient id="leadTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5685DD" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#5685DD" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="#E8EEF7"
              strokeDasharray="2 8"
            />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              interval={0}
              tick={{
                fill: "#94A3B8",
                fontSize: 10,
                fontFamily: "Plus Jakarta Sans",
              }}
              dy={6}
              tickFormatter={(value) =>
                ["5", "13", "21", "29"].includes(String(value))
                  ? `Dec ${value}`
                  : ""
              }
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              domain={[0, 80]}
              ticks={[0, 20, 40, 60, 80]}
              tick={{
                fill: "#94A3B8",
                fontSize: 10,
                fontFamily: "Plus Jakarta Sans",
              }}
            />
            <Tooltip
              cursor={{
                stroke: "#93C5FD",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
              formatter={(value) => [`${value}`, "Leads"]}
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.label ?? ""
              }
              contentStyle={{
                borderRadius: 10,
                borderColor: "var(--border)",
                fontSize: 12,
                fontFamily: "Plus Jakarta Sans",
              }}
            />
            <Area
              type="monotone"
              dataKey="leads"
              stroke="#5685DD"
              strokeWidth={2.5}
              fill="url(#leadTrendFill)"
              dot={{ r: 3, fill: "#fff", stroke: "#5685DD", strokeWidth: 2 }}
              activeDot={{
                r: 5,
                fill: "#5685DD",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SourceIcon({ source }: { source: string }) {
  const icon =
    source === "Website" ? (
      <Globe className="h-3.5 w-3.5" />
    ) : source === "Google Ads" ? (
      <Megaphone className="h-3.5 w-3.5" />
    ) : source === "Referral" ? (
      <UsersRound className="h-3.5 w-3.5" />
    ) : source === "Social Media" ? (
      <Share2 className="h-3.5 w-3.5" />
    ) : (
      <Sparkles className="h-3.5 w-3.5" />
    );
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#F1F5F9] text-[#64748B]">
        {icon}
      </span>
      {source}
    </span>
  );
}

function IndustryIcon({ industry }: { industry: string }) {
  const icon =
    industry === "Healthcare" ? (
      <Activity className="h-3.5 w-3.5" />
    ) : industry === "Retail" ? (
      <ShoppingBag className="h-3.5 w-3.5" />
    ) : industry === "Manufacturing" ? (
      <Package className="h-3.5 w-3.5" />
    ) : industry === "Services" ? (
      <BriefcaseBusiness className="h-3.5 w-3.5" />
    ) : (
      <Sparkles className="h-3.5 w-3.5" />
    );
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#F1F5F9] text-[#64748B]">
        {icon}
      </span>
      {industry}
    </span>
  );
}

function LeadForm({
  editing,
  onSave,
  onCancel,
}: {
  editing: Lead | null;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <DialogContent
      key={editing?.id ?? "new-lead"}
      className="max-h-[90vh] overflow-y-auto sm:max-w-xl"
    >
      <DialogHeader>
        <DialogTitle>{editing ? "Edit lead" : "Add lead"}</DialogTitle>
        <DialogDescription>
          Keep contact details and the next step together.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={onSave} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Lead name" required>
            <Input
              name="name"
              defaultValue={editing?.name}
              required
              placeholder="Full name"
            />
          </FormField>
          <FormField label="Company" required>
            <Input
              name="company"
              defaultValue={editing?.company}
              required
              placeholder="Company name"
            />
          </FormField>
          <FormField label="Phone">
            <Input
              name="phone"
              defaultValue={editing?.phone}
              placeholder="Phone number"
            />
          </FormField>
          <FormField label="Email">
            <Input
              name="email"
              type="email"
              defaultValue={editing?.email}
              placeholder="name@company.com"
            />
          </FormField>
          <FormField label="Lead source">
            <Select name="source" defaultValue={editing?.source ?? "Website"}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  "Website",
                  "Google Ads",
                  "Referral",
                  "Social Media",
                  "Others",
                ].map((source) => (
                  <SelectItem value={source} key={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Lead value (₹)">
            <Input
              name="value"
              type="number"
              min="0"
              defaultValue={editing?.value ?? 0}
            />
          </FormField>
          <FormField label="Status">
            <Select name="status" defaultValue={editing?.status ?? "New"}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["New", "Contacted", "Qualified", "Proposal", "Converted"].map(
                  (status) => (
                    <SelectItem value={status} key={status}>
                      {status}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Next follow-up">
            <Input
              name="nextFollowUp"
              defaultValue={editing?.nextFollowUp ?? "08 May, 2026"}
            />
          </FormField>
        </div>
        <FormField label="Notes">
          <Textarea
            name="notes"
            defaultValue={editing?.notes}
            placeholder="Add context for the next conversation"
          />
        </FormField>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{editing ? "Save changes" : "Add lead"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function LeadDetail({
  lead,
  onEdit,
  onConvert,
}: {
  lead: Lead;
  onEdit?: (() => void) | undefined;
  onConvert?: (() => void) | undefined;
}) {
  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
      <DialogHeader>
        <div className="flex items-start justify-between gap-4 pr-7">
          <div className="min-w-0">
            <DialogTitle>{lead.name}</DialogTitle>
            <DialogDescription className="mt-1">
              {lead.company}
            </DialogDescription>
          </div>
          <StatusBadge status={lead.status} />
        </div>
      </DialogHeader>
      <dl className="grid gap-x-6 gap-y-4 rounded-2xl bg-muted/50 p-4 sm:grid-cols-2">
        <DetailItem label="Phone" value={lead.phone} />
        <DetailItem label="Email" value={lead.email} />
        <DetailItem label="Lead source" value={lead.source} />
        <DetailItem label="Potential value" value={currency(lead.value)} />
        <DetailItem label="Owner" value={lead.owner} />
        <DetailItem label="Created on" value={lead.createdOn} />
        <DetailItem label="Next follow-up" value={lead.nextFollowUp} />
        <DetailItem
          label="Status"
          value={<StatusBadge status={lead.status} />}
        />
      </dl>
      <div>
        <SectionLabel>Notes</SectionLabel>
        <p className="text-xs leading-5 text-muted-foreground">
          {lead.notes || "No notes yet."}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-0.5">
        <ActionIconButton
          icon={Phone}
          label={`Call ${lead.name}`}
          onClick={() =>
            notify.info(`Calling ${lead.name} is a frontend preview.`)
          }
        />
        <ActionIconButton
          icon={ACTION_ICONS.email}
          label={`Email ${lead.email}`}
          onClick={() =>
            notify.info(`Email to ${lead.email} is a frontend preview.`)
          }
        />
        <ActionIconButton
          icon={ACTION_ICONS.whatsapp}
          label={`WhatsApp ${lead.name}`}
          onClick={() =>
            notify.info(`WhatsApp for ${lead.name} is a frontend preview.`)
          }
        />
      </div>
      {onEdit || onConvert ? (
        <DialogFooter className="gap-2 sm:gap-2">
          {onEdit ? (
            <Button variant="outline" onClick={onEdit}>
              Edit lead
            </Button>
          ) : null}
          {onConvert ? (
            <Button onClick={onConvert}>
              <Check />
              Convert to customer
            </Button>
          ) : null}
        </DialogFooter>
      ) : null}
    </DialogContent>
  );
}

export function LeadsPage() {
  const { can } = useAuth();
  const canCreate = can("leads", "create");
  const canEdit = can("leads", "edit");
  const canDelete = can("leads", "delete");
  const canImport = can("leads", "import");
  const canExport = can("leads", "export");
  const [leads, setLeads] = useState(() => loadLeads());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const totalLeads = leads.length;
  const hotLeads = leads.filter((lead) => lead.status === "Hot").length;
  const convertedLeads = leads.filter(
    (lead) => lead.status === "Converted",
  ).length;
  const openLeads = leads.filter(
    (lead) => lead.status !== "Converted" && lead.status !== "Lost",
  ).length;
  const liveLeadSources = Object.entries(
    leads.reduce<Record<string, number>>((acc, lead) => {
      acc[lead.source] = (acc[lead.source] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value], index) => ({
    name,
    value,
    color: ["#5685DD", "#449EA8", "#9271D0", "#43A980", "#DF9B60"][index % 5]!,
  }));
  const createLead = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const editLead = (lead: Lead) => {
    setSelected(null);
    setEditing(lead);
    setFormOpen(true);
  };
  const saveLead = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const record: Lead = {
      id: editing?.id ?? `lead-${Date.now()}`,
      name: String(form.get("name") ?? ""),
      company: String(form.get("company") ?? ""),
      phone: String(form.get("phone") ?? ""),
      email: String(form.get("email") ?? ""),
      source: String(form.get("source") ?? "Website"),
      status: String(form.get("status") ?? "New"),
      value: Number(form.get("value") ?? 0),
      nextFollowUp: String(form.get("nextFollowUp") ?? "—"),
      notes: String(form.get("notes") ?? ""),
      owner: editing?.owner ?? "Jane Mitchell",
      createdOn: editing?.createdOn ?? "27 Nov 2026",
    };
    const next = editing
      ? leads.map((lead) => (lead.id === editing.id ? record : lead))
      : [record, ...leads];
    setLeads(saveLeads(next));
    setFormOpen(false);
    recordAndToast({
      module: "leads",
      eventType: editing ? "lead.updated" : "lead.created",
      title: editing ? "Lead updated" : "Lead created",
      description: `${record.name} · ${record.company}`,
      severity: "success",
      operationStatus: "succeeded",
      relatedRecordId: record.id,
      relatedRoute: "/leads",
      idempotencyKey: `lead-${editing ? "upd" : "add"}-${record.id}-${Date.now()}`,
    });
  };
  const convertLead = (lead: Lead) => {
    const customer = convertLeadToCustomer(lead);
    setLeads(loadLeads());
    setSelected(null);
    recordAndToast({
      module: "leads",
      eventType: "lead.converted",
      title: "Lead converted",
      description: `${lead.name} converted to customer ${customer.company}.`,
      severity: "success",
      operationStatus: "succeeded",
      relatedRecordId: customer.id,
      relatedRoute: "/customers",
      idempotencyKey: `lead-convert-${lead.id}-${customer.id}`,
    });
  };
  const statuses = ["New", "Contacted", "Qualified", "Proposal", "Converted"];
  const sources = [
    "Website",
    "Google Ads",
    "Referral",
    "Social Media",
    "Others",
  ];
  const filtered = leads.filter((lead) => {
    const matchesQuery =
      query.trim().length === 0 ||
      [lead.name, lead.company, lead.email, lead.source, lead.owner].some(
        (value) => value.toLowerCase().includes(query.trim().toLowerCase()),
      );
    const matchesStatus =
      statusFilter === "all" || lead.status === statusFilter;
    const matchesSource =
      sourceFilter === "all" || lead.source === sourceFilter;
    return matchesQuery && matchesStatus && matchesSource;
  });
  const pageSize = 5;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleRows = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const allVisibleChecked =
    visibleRows.length > 0 && visibleRows.every((row) => checked.has(row.id));
  const toggleAll = (value: boolean) => {
    setChecked((current) => {
      const next = new Set(current);
      visibleRows.forEach((row) => {
        if (value) next.add(row.id);
        else next.delete(row.id);
      });
      return next;
    });
  };

  return (
    <AppShell>
      <PageHeader
        title="Leads"
        actions={
          <ImportExportToolbar
            config={leadsImportConfig}
            records={filtered}
            onImported={() => setLeads(loadLeads())}
            addNewLabel={canCreate ? "Add Lead" : undefined}
            onAddNew={canCreate ? createLead : undefined}
            includeImport={canImport}
            includeExport={canExport}
            includeSample={canImport}
          />
        }
      />

      <section className="metric-grid mb-5 grid grid-cols-1 sm:mb-6 sm:grid-cols-2 xl:grid-cols-4">
        <LeadKpiCard
          label="Total Leads"
          value={String(totalLeads)}
          change="live"
          spark={leadMetricSparks.total}
          color="#5685DD"
          sparkId="spark-total"
        />
        <LeadKpiCard
          label="Hot Leads"
          value={String(hotLeads)}
          change="live"
          spark={leadMetricSparks.hot}
          color="#9271D0"
          sparkId="spark-hot"
        />
        <LeadKpiCard
          label="Converted"
          value={String(convertedLeads)}
          change="live"
          spark={leadMetricSparks.converted}
          color="#43A980"
          sparkId="spark-converted"
        />
        <LeadKpiCard
          label="Open Leads"
          value={String(openLeads)}
          change="live"
          positive={openLeads >= 0}
          spark={leadMetricSparks.open}
          color="#DF9B60"
          sparkId="spark-open"
        />
      </section>

      <div className="leads-analytics-grid mb-5">
        <section className="leads-analytics-card leads-analytics-card--funnel">
          <h2 className="leads-analytics-card__title">Lead Funnel</h2>
          <div className="leads-analytics-card__body leads-analytics-card__body--funnel">
            <LeadFunnelChart stages={leadFunnel} />
          </div>
        </section>

        <section className="leads-analytics-card">
          <h2 className="leads-analytics-card__title">Leads by Source</h2>
          <div className="leads-analytics-card__body">
            <LeadsSourceChart
              sources={liveLeadSources.length ? liveLeadSources : leadSources}
              total={totalLeads}
            />
          </div>
        </section>

        <section className="leads-analytics-card">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="leads-analytics-card__title mb-0">Lead Trend</h2>
            <Select defaultValue="month">
              <SelectTrigger className="h-8 w-[110px] rounded-full border-[#dbe7ff] bg-white/80 text-xs shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="leads-analytics-card__body">
            <LeadTrendChart series={leadTrend} />
          </div>
        </section>
      </div>

      <section className="crm-card min-w-0">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
          <h2 className="text-[15px] font-bold tracking-tight">
            All Leads ({totalLeads.toLocaleString("en-US")})
          </h2>
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
            <label className="relative min-w-[180px] max-w-xs flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search leads…"
                className="h-10 rounded-xl border-border bg-background pl-9 text-sm shadow-none"
              />
            </label>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-[130px] rounded-xl text-sm">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={sourceFilter}
              onValueChange={(value) => {
                setSourceFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-[140px] rounded-xl text-sm">
                <SelectValue placeholder="All Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Source</SelectItem>
                {sources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-10 rounded-xl px-3 text-sm"
              onClick={() =>
                notify.info("Advanced filters are a frontend preview.")
              }
            >
              <Filter className="h-3.5 w-3.5" />
              Filter
            </Button>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead className="bg-[#F8FAFC] text-xs font-semibold text-muted-foreground">
              <tr>
                <th className="w-10 px-3 py-2.5">
                  <Checkbox
                    checked={allVisibleChecked}
                    onCheckedChange={(value) => toggleAll(Boolean(value))}
                    aria-label="Select all visible leads"
                  />
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  Lead Name
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  Company
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  Source
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  Status
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  Lead Owner
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  Created On
                </th>
                <th className="w-[108px] px-2 py-2.5 text-right" />
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-t border-border/70 transition-colors hover:bg-muted/40"
                >
                  <td className="whitespace-nowrap px-3 py-2.5 align-middle">
                    <Checkbox
                      checked={checked.has(lead.id)}
                      onCheckedChange={(value) => {
                        setChecked((current) => {
                          const next = new Set(current);
                          if (value) next.add(lead.id);
                          else next.delete(lead.id);
                          return next;
                        });
                      }}
                      aria-label={`Select ${lead.name}`}
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 align-middle">
                    <button
                      type="button"
                      className="flex min-w-0 items-center gap-2.5 text-left"
                      onClick={() => setSelected(lead)}
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#EAF0FF] text-[11px] font-semibold text-[#2F6BFF]">
                        {initials(lead.name)}
                      </span>
                      <span className="truncate font-semibold text-foreground hover:underline">
                        {lead.name}
                      </span>
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 align-middle text-muted-foreground">
                    {lead.company}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 align-middle">
                    <SourceIcon source={lead.source} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 align-middle">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 align-middle">
                    <span className="inline-flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#F1F5F9] text-[10px] font-semibold text-foreground">
                        {initials(lead.owner)}
                      </span>
                      <span className="font-medium text-foreground">
                        {lead.owner}
                      </span>
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 align-middle text-muted-foreground">
                    {lead.createdOn}
                  </td>
                  <td className="w-[108px] whitespace-nowrap px-2 py-2 text-right align-middle">
                    <RowActions
                      onView={() => setSelected(lead)}
                      onEdit={canEdit ? () => editLead(lead) : undefined}
                      onDelete={
                        canDelete
                          ? () => {
                              const next = leads.filter(
                                (item) => item.id !== lead.id,
                              );
                              setLeads(saveLeads(next));
                              recordAndToast({
                                module: "leads",
                                eventType: "lead.deleted",
                                title: "Lead removed",
                                description: `${lead.name} was deleted.`,
                                severity: "warning",
                                operationStatus: "succeeded",
                                relatedRecordId: lead.id,
                                relatedRoute: "/leads",
                                idempotencyKey: `lead-del-${lead.id}-${Date.now()}`,
                              });
                            }
                          : undefined
                      }
                    />
                  </td>
                </tr>
              ))}
              {visibleRows.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-muted-foreground"
                  >
                    No leads match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#E8EEF3] px-5 py-3.5 text-[13px] text-muted-foreground">
          <span>
            Showing {(currentPage - 1) * pageSize + (filtered.length ? 1 : 0)}–
            {Math.min(currentPage * pageSize, filtered.length)} of{" "}
            {filtered.length} leads
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous page"
              className="h-8 w-8 rounded-lg"
              disabled={currentPage <= 1}
              onClick={() => setPage((value) => Math.max(value - 1, 1))}
            >
              <ChevronLeft />
            </Button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map(
              (pageNumber) => (
                <Button
                  key={pageNumber}
                  variant={pageNumber === currentPage ? "default" : "outline"}
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-lg text-xs",
                    pageNumber === currentPage &&
                      "bg-[#2F6BFF] hover:bg-[#2558d9]",
                  )}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </Button>
              ),
            )}
            <Button
              variant="outline"
              size="icon"
              aria-label="Next page"
              className="h-8 w-8 rounded-lg"
              disabled={currentPage >= pageCount}
              onClick={() => setPage((value) => Math.min(value + 1, pageCount))}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <LeadForm
          editing={editing}
          onSave={saveLead}
          onCancel={() => setFormOpen(false)}
        />
      </Dialog>
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        {selected && (
          <LeadDetail
            lead={selected}
            onEdit={canEdit ? () => editLead(selected) : undefined}
            onConvert={
              can("customers", "create")
                ? () => convertLead(selected)
                : undefined
            }
          />
        )}
      </Dialog>
    </AppShell>
  );
}

function CustomerForm({
  editing,
  onSave,
  onCancel,
}: {
  editing: Customer | null;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <DialogContent
      key={editing?.id ?? "new-customer"}
      className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
    >
      <DialogHeader>
        <DialogTitle>{editing ? "Edit customer" : "Add customer"}</DialogTitle>
        <DialogDescription>
          Contact, billing and account information.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={onSave} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Customer name" required>
            <Input name="name" defaultValue={editing?.name} required />
          </FormField>
          <FormField label="Company" required>
            <Input name="company" defaultValue={editing?.company} required />
          </FormField>
          <FormField label="Phone">
            <Input name="phone" defaultValue={editing?.phone} />
          </FormField>
          <FormField label="WhatsApp">
            <Input
              name="whatsappNumber"
              defaultValue={editing?.whatsappNumber ?? editing?.phone}
            />
          </FormField>
          <FormField label="Email">
            <Input name="email" type="email" defaultValue={editing?.email} />
          </FormField>
          <FormField label="Industry">
            <Select
              name="industry"
              defaultValue={editing?.industry ?? "Services"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  "Healthcare",
                  "Retail",
                  "Manufacturing",
                  "Services",
                  "Others",
                ].map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Status">
            <Select name="status" defaultValue={editing?.status ?? "Active"}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Active", "Inactive", "Blocked"].map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Total business (₹)">
            <Input
              name="business"
              type="number"
              min="0"
              defaultValue={editing?.business ?? 0}
            />
          </FormField>
          <FormField label="Outstanding balance (₹)">
            <Input
              type="number"
              min="0"
              value={editing?.outstanding ?? 0}
              disabled
              readOnly
            />
            <input
              type="hidden"
              name="outstanding"
              value={editing?.outstanding ?? 0}
            />
            <p className="text-[11px] font-normal text-muted-foreground">
              Computed from unpaid invoices after issue/payment.
            </p>
          </FormField>
          <FormField label="Deals">
            <Input
              name="deals"
              type="number"
              min="0"
              defaultValue={editing?.deals ?? 0}
            />
          </FormField>
          <FormField label="GSTIN">
            <Input name="gstin" defaultValue={editing?.gstin} />
          </FormField>
        </div>
        <FormField label="Billing address">
          <Textarea
            name="billingAddress"
            defaultValue={editing?.billingAddress}
            rows={2}
          />
        </FormField>
        <FormField label="Shipping address">
          <Textarea
            name="shippingAddress"
            defaultValue={editing?.shippingAddress}
            rows={2}
          />
        </FormField>
        <FormField label="Notes">
          <Textarea name="notes" defaultValue={editing?.notes} rows={2} />
        </FormField>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {editing ? "Save changes" : "Add customer"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function CustomerDetail({
  customer,
  onEdit,
}: {
  customer: Customer;
  onEdit?: (() => void) | undefined;
}) {
  const { can } = useAuth();
  const showInvoices = can("invoices", "view");
  const showQuotations = can("quotations", "view");
  const showPayments = can("payments", "view");
  const showFinance = showInvoices || showPayments;
  const invoices = showInvoices
    ? listInvoiceIndex().filter(
        (invoice) => invoice.customer === customer.company,
      )
    : [];
  const quotations = showQuotations
    ? listQuotations().filter(
        (quote) =>
          quote.customerId === customer.id ||
          quote.company === customer.company,
      )
    : [];
  const payments = showPayments
    ? listPayments().filter((payment) =>
        invoices.some((invoice) => invoice.id === payment.invoiceId),
      )
    : [];
  const outstanding = showInvoices
    ? invoices
        .filter(
          (invoice) => invoice.status !== "Draft" && invoice.status !== "Paid",
        )
        .reduce((sum, invoice) => sum + invoice.balance, 0)
    : 0;
  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <div className="flex items-start justify-between gap-4 pr-7">
          <div className="min-w-0">
            <DialogTitle>{customer.name}</DialogTitle>
            <DialogDescription className="mt-1">
              {customer.company}
            </DialogDescription>
          </div>
          <StatusBadge status={customer.status} />
        </div>
      </DialogHeader>
      <section>
        <SectionLabel>Contact details</SectionLabel>
        <dl className="grid gap-x-6 gap-y-3 rounded-2xl bg-muted/50 p-4 sm:grid-cols-2">
          <DetailItem label="Phone" value={customer.phone} />
          <DetailItem
            label="WhatsApp"
            value={customer.whatsappNumber || customer.phone}
          />
          <DetailItem label="Email" value={customer.email} />
          <DetailItem label="Industry" value={customer.industry} />
          <DetailItem label="Owner" value={customer.owner} />
          <DetailItem label="Deals" value={customer.deals} />
          {showFinance ? (
            <DetailItem
              label="Total business"
              value={currency(customer.business)}
            />
          ) : null}
          {showInvoices ? (
            <DetailItem
              label="Outstanding balance"
              value={currency(outstanding)}
            />
          ) : null}
          <DetailItem label="Created on" value={customer.createdOn} />
        </dl>
      </section>
      <div className="grid gap-4 sm:grid-cols-2">
        <section>
          <SectionLabel>Billing address</SectionLabel>
          <p className="text-xs leading-5 text-muted-foreground">
            {customer.billingAddress}
          </p>
        </section>
        <section>
          <SectionLabel>Shipping address</SectionLabel>
          <p className="text-xs leading-5 text-muted-foreground">
            {customer.shippingAddress}
          </p>
        </section>
      </div>
      <section>
        <SectionLabel>Tax details</SectionLabel>
        <dl className="rounded-2xl bg-muted/50 p-3">
          <DetailItem label="GSTIN" value={customer.gstin} />
        </dl>
      </section>
      {showInvoices ? (
        <section>
          <SectionLabel>Invoice history</SectionLabel>
          {invoices.length > 0 ? (
            <div className="divide-y divide-border rounded-2xl border border-border">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-3 py-2.5 text-xs"
                >
                  <span className="font-medium">{invoice.number}</span>
                  <span className="text-muted-foreground">
                    {currency(invoice.total)} · Bal {currency(invoice.balance)}
                  </span>
                  <StatusBadge status={invoice.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No invoices yet.</p>
          )}
        </section>
      ) : null}
      {showQuotations ? (
        <section>
          <SectionLabel>Quotation history</SectionLabel>
          {quotations.length > 0 ? (
            <div className="divide-y divide-border rounded-2xl border border-border">
              {quotations.map((quote) => (
                <div
                  key={quote.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-3 py-2.5 text-xs"
                >
                  <span className="font-medium">{quote.number}</span>
                  <span className="text-muted-foreground">
                    {currency(quote.grandTotal)}
                  </span>
                  <StatusBadge status={quote.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No quotations yet.</p>
          )}
        </section>
      ) : null}
      {showPayments ? (
        <section>
          <SectionLabel>Payment history</SectionLabel>
          {payments.length > 0 ? (
            <div className="divide-y divide-border rounded-2xl border border-border">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 text-xs"
                >
                  <span className="font-medium">
                    {payment.invoiceNumber} · {payment.method}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {currency(payment.amount)} · {payment.paidAt}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No payments yet.</p>
          )}
        </section>
      ) : null}
      <section>
        <SectionLabel>Notes</SectionLabel>
        <p className="text-xs leading-5 text-muted-foreground">
          {customer.notes || "No notes yet."}
        </p>
      </section>
      <DialogFooter>
        {onEdit ? (
          <Button variant="outline" onClick={onEdit}>
            Edit customer
          </Button>
        ) : null}
        {showInvoices ? (
          <Button
            onClick={() =>
              notify.info(
                `Statement preview: Outstanding ${currency(outstanding)} across ${invoices.length} invoices.`,
              )
            }
          >
            <FileText />
            Customer statement
          </Button>
        ) : null}
      </DialogFooter>
    </DialogContent>
  );
}

export function CustomersPage() {
  const { can } = useAuth();
  const canCreate = can("customers", "create");
  const canEdit = can("customers", "edit");
  const canDelete = can("customers", "delete");
  const canImport = can("customers", "import");
  const canExport = can("customers", "export");
  const [customers, setCustomers] = useState(() => loadCustomers());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(
    (customer) => customer.status === "Active",
  ).length;
  const inactiveCustomers = customers.filter(
    (customer) => customer.status !== "Active",
  ).length;
  const createCustomer = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const editCustomer = (customer: Customer) => {
    setSelected(null);
    setEditing(customer);
    setFormOpen(true);
  };
  const saveCustomer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const phone = String(form.get("phone") ?? "");
    const record: Customer = {
      id: editing?.id ?? `customer-${Date.now()}`,
      name: String(form.get("name") ?? ""),
      company: String(form.get("company") ?? ""),
      phone,
      whatsappNumber: String(form.get("whatsappNumber") ?? phone),
      email: String(form.get("email") ?? ""),
      business: Number(form.get("business") ?? 0),
      outstanding: Number(form.get("outstanding") ?? 0),
      status: String(form.get("status") ?? "Active"),
      industry: String(form.get("industry") ?? "Services"),
      deals: Number(form.get("deals") ?? 0),
      owner: editing?.owner ?? "Jane Mitchell",
      createdOn: editing?.createdOn ?? "27 Nov 2026",
      billingAddress: String(form.get("billingAddress") ?? ""),
      shippingAddress: String(form.get("shippingAddress") ?? ""),
      gstin: String(form.get("gstin") ?? ""),
      notes: String(form.get("notes") ?? ""),
    };
    const next = editing
      ? customers.map((customer) =>
          customer.id === editing.id
            ? {
                ...record,
                outstanding: editing.outstanding,
                business: editing.business || record.business,
              }
            : customer,
        )
      : [{ ...record, outstanding: 0 }, ...customers];
    setCustomers(saveCustomers(next));
    setCustomers(recomputeCustomerOutstanding());
    setFormOpen(false);
    recordAndToast({
      module: "customers",
      eventType: editing ? "customer.updated" : "customer.created",
      title: editing ? "Customer updated" : "Customer created",
      description: `${record.name} · ${record.company}`,
      severity: "success",
      operationStatus: "succeeded",
      relatedRecordId: record.id,
      relatedRoute: "/customers",
      idempotencyKey: `customer-${editing ? "upd" : "add"}-${record.id}-${Date.now()}`,
    });
  };
  const statuses = ["Active", "Inactive", "Blocked"];
  const industries = [
    "Healthcare",
    "Retail",
    "Manufacturing",
    "Services",
    "Others",
  ];
  const filtered = customers.filter((customer) => {
    const haystack = [
      customer.name,
      customer.company,
      customer.email,
      customer.phone,
      customer.industry,
      customer.owner,
    ]
      .join(" ")
      .toLowerCase();
    const matchesQuery =
      query.trim().length === 0 ||
      haystack.includes(query.trim().toLowerCase());
    const matchesStatus =
      statusFilter === "all" || customer.status === statusFilter;
    const matchesIndustry =
      industryFilter === "all" || customer.industry === industryFilter;
    return matchesQuery && matchesStatus && matchesIndustry;
  });
  const pageSize = 5;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleRows = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const allVisibleChecked =
    visibleRows.length > 0 && visibleRows.every((row) => checked.has(row.id));
  const toggleAll = (value: boolean) => {
    setChecked((current) => {
      const next = new Set(current);
      visibleRows.forEach((row) => {
        if (value) next.add(row.id);
        else next.delete(row.id);
      });
      return next;
    });
  };

  return (
    <AppShell>
      <PageHeader
        title="Customers"
        actions={
          <ImportExportToolbar
            config={customersImportConfig}
            records={filtered}
            onImported={() => {
              setCustomers(loadCustomers());
              setCustomers(recomputeCustomerOutstanding());
            }}
            addNewLabel={canCreate ? "Add Customer" : undefined}
            onAddNew={canCreate ? createCustomer : undefined}
            includeImport={canImport}
            includeExport={canExport}
            includeSample={canImport}
          />
        }
      />

      <section className="metric-grid mb-5 grid grid-cols-1 sm:mb-6 sm:grid-cols-2 xl:grid-cols-4">
        <LeadKpiCard
          label="Total Customers"
          value={String(totalCustomers)}
          change="live"
          spark={customerMetricSparks.total}
          color="#43A980"
          sparkId="cust-total"
        />
        <LeadKpiCard
          label="Active Customers"
          value={String(activeCustomers)}
          change="live"
          spark={customerMetricSparks.active}
          color="#449EA8"
          sparkId="cust-active"
        />
        <LeadKpiCard
          label="Inactive / Blocked"
          value={String(inactiveCustomers)}
          change="live"
          spark={customerMetricSparks.newest}
          color="#9271D0"
          sparkId="cust-new"
        />
        <LeadKpiCard
          label="With Outstanding"
          value={String(
            customers.filter((customer) => customer.outstanding > 0).length,
          )}
          change="live"
          positive={false}
          spark={customerMetricSparks.churned}
          color="#DF9B60"
          sparkId="cust-churn"
        />
      </section>

      <div className="leads-analytics-grid mb-5">
        <section className="crm-card min-w-0 p-5">
          <h2 className="mb-4 text-[15px] font-bold tracking-tight">
            Customers by Industry
          </h2>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            <div className="relative h-[150px] w-[150px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={customerIndustries}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={46}
                    outerRadius={68}
                    paddingAngle={1}
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {customerIndustries.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Share"]}
                    contentStyle={{
                      borderRadius: 10,
                      borderColor: "var(--border)",
                      fontSize: 12,
                      fontFamily: "Plus Jakarta Sans",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold tabular-nums">
                  {totalCustomers.toLocaleString("en-US")}
                </span>
                <span className="text-[10px] text-muted-foreground">Total</span>
              </div>
            </div>
            <ul className="min-w-0 flex-1 space-y-2.5">
              {customerIndustries.map((industry) => (
                <li
                  key={industry.name}
                  className="flex items-center justify-between gap-3 text-[12px]"
                >
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <i
                      className="h-2 w-2 rounded-full"
                      style={{ background: industry.color }}
                    />
                    {industry.name}
                  </span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {industry.value}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="crm-card min-w-0 p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-bold tracking-tight">
              Customer Growth
            </h2>
            <Select defaultValue="2026">
              <SelectTrigger className="h-8 w-[88px] rounded-full border-border text-xs shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="h-[210px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={customerGrowth}
                margin={{ top: 8, right: 4, left: -18, bottom: 0 }}
                barCategoryGap="28%"
              >
                <defs>
                  <linearGradient
                    id="customerGrowthBar"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#5685DD" />
                    <stop offset="100%" stopColor="#5685DD" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="#E8EEF7"
                  strokeDasharray="3 6"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#94A3B8",
                    fontSize: 10,
                    fontFamily: "Plus Jakarta Sans",
                  }}
                  dy={6}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#94A3B8",
                    fontSize: 10,
                    fontFamily: "Plus Jakarta Sans",
                  }}
                />
                <Tooltip
                  formatter={(value) => [`${value}`, "Customers"]}
                  contentStyle={{
                    borderRadius: 10,
                    borderColor: "var(--border)",
                    fontSize: 12,
                    fontFamily: "Plus Jakarta Sans",
                  }}
                />
                <Bar
                  dataKey="customers"
                  fill="url(#customerGrowthBar)"
                  radius={[6, 6, 0, 0]}
                  barSize={16}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="crm-card min-w-0 p-5">
          <h2 className="mb-4 text-[15px] font-bold tracking-tight">
            Customers by Status
          </h2>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            <div className="relative h-[150px] w-[150px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={customerStatuses}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={46}
                    outerRadius={68}
                    paddingAngle={1}
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {customerStatuses.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Share"]}
                    contentStyle={{
                      borderRadius: 10,
                      borderColor: "var(--border)",
                      fontSize: 12,
                      fontFamily: "Plus Jakarta Sans",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold tabular-nums">83.6%</span>
                <span className="text-[10px] text-muted-foreground">
                  Active
                </span>
              </div>
            </div>
            <ul className="min-w-0 flex-1 space-y-2.5">
              {customerStatuses.map((status) => (
                <li
                  key={status.name}
                  className="flex items-center justify-between gap-3 text-[12px]"
                >
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <i
                      className="h-2 w-2 rounded-full"
                      style={{ background: status.color }}
                    />
                    {status.name}
                  </span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {status.value}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <section className="crm-card min-w-0">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
          <h2 className="text-[15px] font-bold tracking-tight">
            All Customers ({totalCustomers.toLocaleString("en-US")})
          </h2>
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
            <label className="relative min-w-[180px] max-w-xs flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search customers…"
                className="h-10 rounded-xl border-border bg-background pl-9 text-sm shadow-none"
              />
            </label>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-[130px] rounded-xl text-sm">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={industryFilter}
              onValueChange={(value) => {
                setIndustryFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-[140px] rounded-xl text-sm">
                <SelectValue placeholder="All Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industry</SelectItem>
                {industries.map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-10 rounded-xl px-3 text-sm"
              onClick={() =>
                notify.info("Advanced filters are a frontend preview.")
              }
            >
              <Filter className="h-3.5 w-3.5" />
              Filter
            </Button>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead className="bg-[#F8FAFC] text-xs font-semibold text-muted-foreground">
              <tr>
                <th className="w-10 px-3 py-2.5">
                  <Checkbox
                    checked={allVisibleChecked}
                    onCheckedChange={(value) => toggleAll(Boolean(value))}
                    aria-label="Select all visible customers"
                  />
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  Customer Name
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  Company
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  Industry
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  Status
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  Owner
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  Created On
                </th>
                <th className="w-[108px] px-2 py-2.5 text-right" />
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-t border-border/70 transition-colors hover:bg-muted/40"
                >
                  <td className="whitespace-nowrap px-3 py-2.5 align-middle">
                    <Checkbox
                      checked={checked.has(customer.id)}
                      onCheckedChange={(value) => {
                        setChecked((current) => {
                          const next = new Set(current);
                          if (value) next.add(customer.id);
                          else next.delete(customer.id);
                          return next;
                        });
                      }}
                      aria-label={`Select ${customer.name}`}
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 align-middle">
                    <button
                      type="button"
                      className="flex min-w-0 items-center gap-2.5 text-left"
                      onClick={() => setSelected(customer)}
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#EAF0FF] text-[11px] font-semibold text-[#2F6BFF]">
                        {initials(customer.name)}
                      </span>
                      <span className="truncate font-semibold text-foreground hover:underline">
                        {customer.name}
                      </span>
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 align-middle text-muted-foreground">
                    {customer.company}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 align-middle">
                    <IndustryIcon industry={customer.industry} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 align-middle">
                    <StatusBadge status={customer.status} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 align-middle">
                    <span className="inline-flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#F1F5F9] text-[10px] font-semibold text-foreground">
                        {initials(customer.owner)}
                      </span>
                      <span className="font-medium text-foreground">
                        {customer.owner}
                      </span>
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 align-middle text-muted-foreground">
                    {customer.createdOn}
                  </td>
                  <td className="w-[108px] whitespace-nowrap px-2 py-2 text-right align-middle">
                    <RowActions
                      onView={() => setSelected(customer)}
                      onEdit={
                        canEdit ? () => editCustomer(customer) : undefined
                      }
                      onDelete={
                        canDelete
                          ? () => {
                              const next = customers.filter(
                                (item) => item.id !== customer.id,
                              );
                              setCustomers(saveCustomers(next));
                              recordAndToast({
                                module: "customers",
                                eventType: "customer.deleted",
                                title: "Customer removed",
                                description: `${customer.name} was deleted.`,
                                severity: "warning",
                                operationStatus: "succeeded",
                                relatedRecordId: customer.id,
                                relatedRoute: "/customers",
                                idempotencyKey: `customer-del-${customer.id}-${Date.now()}`,
                              });
                            }
                          : undefined
                      }
                    />
                  </td>
                </tr>
              ))}
              {visibleRows.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-muted-foreground"
                  >
                    No customers match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#E8EEF3] px-5 py-3.5 text-[13px] text-muted-foreground">
          <span>
            Showing {(currentPage - 1) * pageSize + (filtered.length ? 1 : 0)}–
            {Math.min(currentPage * pageSize, filtered.length)} of{" "}
            {filtered.length} customers
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous page"
              className="h-8 w-8 rounded-lg"
              disabled={currentPage <= 1}
              onClick={() => setPage((value) => Math.max(value - 1, 1))}
            >
              <ChevronLeft />
            </Button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map(
              (pageNumber) => (
                <Button
                  key={pageNumber}
                  variant={pageNumber === currentPage ? "default" : "outline"}
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-lg text-xs",
                    pageNumber === currentPage &&
                      "bg-[#2F6BFF] hover:bg-[#2558d9]",
                  )}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </Button>
              ),
            )}
            <Button
              variant="outline"
              size="icon"
              aria-label="Next page"
              className="h-8 w-8 rounded-lg"
              disabled={currentPage >= pageCount}
              onClick={() => setPage((value) => Math.min(value + 1, pageCount))}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <CustomerForm
          editing={editing}
          onSave={saveCustomer}
          onCancel={() => setFormOpen(false)}
        />
      </Dialog>
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        {selected && (
          <CustomerDetail
            customer={selected}
            onEdit={canEdit ? () => editCustomer(selected) : undefined}
          />
        )}
      </Dialog>
    </AppShell>
  );
}

const dealStages = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost",
];

function DealProgressRing({
  percent,
  color,
  track,
  size = 72,
  stroke = 8,
  children,
}: {
  percent: number;
  color: string;
  track: string;
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference - (Math.min(Math.max(percent, 0), 100) / 100) * circumference;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={track}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        {children}
      </div>
    </div>
  );
}

function DealRingCard({
  label,
  value,
  percent,
  color,
  track,
}: (typeof dealKpiRings)[number]) {
  return (
    <article className="metric-card flex min-h-[var(--card-kpi-min-h)] min-w-0 flex-col justify-center p-[var(--card-pad-kpi)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium leading-snug text-slate-600">
            {label}
          </p>
          <p
            className="metric-card__value mt-2 text-[24px] font-bold leading-none tracking-tight text-slate-800 sm:text-[26px]"
            title={value}
          >
            {value}
          </p>
        </div>
        <DealProgressRing
          percent={percent}
          color={color}
          track={track}
          size={64}
          stroke={9}
        >
          <span className="text-[12px] font-bold tabular-nums text-slate-800">
            {percent}%
          </span>
        </DealProgressRing>
      </div>
    </article>
  );
}

function DealSemiGauge({
  name,
  value,
  color,
  track,
}: (typeof dealGauges)[number]) {
  const data = [
    { name: "value", value, fill: color },
    { name: "rest", value: Math.max(0, 100 - value), fill: track },
  ];
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center">
      <div className="relative h-[88px] w-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              startAngle={180}
              endAngle={0}
              innerRadius={42}
              outerRadius={58}
              stroke="none"
              cy="100%"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-x-0 bottom-1 flex flex-col items-center">
          <span className="text-lg font-bold tabular-nums leading-none text-slate-800">
            {value}%
          </span>
        </div>
      </div>
      <p className="mt-1 text-center text-[11px] font-semibold text-slate-600">
        {name}
      </p>
    </div>
  );
}

function DealPipelineOverview() {
  const max = Math.max(...dealStageBars.map((stage) => stage.value), 1);
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col items-center justify-center">
        <div className="relative h-[150px] w-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dealFunnel}
                dataKey="value"
                nameKey="name"
                startAngle={180}
                endAngle={0}
                innerRadius={58}
                outerRadius={88}
                paddingAngle={2}
                stroke="#fff"
                strokeWidth={3}
                cy="100%"
              >
                {dealFunnel.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} deals`, name]}
                contentStyle={{
                  borderRadius: 12,
                  borderColor: "var(--border)",
                  fontSize: 12,
                  fontFamily: "Plus Jakarta Sans",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-x-0 bottom-2 flex flex-col items-center">
            <span className="text-xl font-bold tabular-nums">246</span>
            <span className="text-[10px] text-muted-foreground">
              Total deals
            </span>
          </div>
        </div>
        <ul className="mt-3 grid w-full grid-cols-2 gap-x-3 gap-y-2">
          {dealFunnel.map((stage) => (
            <li
              key={stage.name}
              className="flex items-center gap-2 text-[11px]"
            >
              <i
                className="h-2 w-2 rounded-full"
                style={{ background: stage.fill }}
              />
              <span className="truncate text-muted-foreground">
                {stage.name}
              </span>
              <span className="ml-auto font-semibold tabular-nums">
                {stage.value}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex min-h-[220px] items-end gap-1.5 overflow-x-auto rounded-[18px] bg-[#F8FAFC] px-3 pb-3 pt-5 sm:gap-2.5 sm:px-4 sm:pb-4 sm:pt-6">
        {dealStageBars.map((stage) => (
          <div
            key={stage.name}
            className="flex min-w-[52px] flex-1 flex-col items-center gap-1.5 sm:min-w-0 sm:gap-2"
          >
            <span className="text-[10px] font-bold tabular-nums text-slate-700 sm:text-[11px]">
              {stage.value}
            </span>
            <div className="relative flex h-[120px] w-full items-end justify-center sm:h-[140px]">
              <div
                className="w-[70%] max-w-[28px] rounded-full shadow-[var(--shadow-soft)]"
                style={{
                  height: `${Math.max((stage.value / max) * 100, 12)}%`,
                  background: `linear-gradient(180deg, ${stage.fill} 0%, ${stage.fill}cc 100%)`,
                }}
              />
            </div>
            <span
              className="max-w-full text-center text-[9px] font-semibold leading-tight text-slate-600 sm:text-[10px]"
              title={stage.name}
            >
              {stage.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DealForm({
  editing,
  onSave,
  onCancel,
}: {
  editing: Deal | null;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <DialogContent
      key={editing?.id ?? "new-deal"}
      className="max-h-[90vh] overflow-y-auto sm:max-w-xl"
    >
      <DialogHeader>
        <DialogTitle>{editing ? "Edit deal" : "Add deal"}</DialogTitle>
        <DialogDescription>
          Set the value, stage, and expected close date.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={onSave} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Deal name" required>
            <Input
              name="name"
              required
              defaultValue={editing?.name}
              placeholder="Project or opportunity"
            />
          </FormField>
          <FormField label="Customer">
            <Select
              name="customer"
              defaultValue={
                editing?.customer ?? loadCustomers()[0]?.company ?? ""
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {loadCustomers().map((customer) => (
                  <SelectItem key={customer.id} value={customer.company}>
                    {customer.company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Deal value (₹)">
            <Input
              name="value"
              type="number"
              min="0"
              defaultValue={editing?.value ?? 0}
            />
          </FormField>
          <FormField label="Stage">
            <Select name="stage" defaultValue={editing?.stage ?? "New"}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dealStages.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Expected closing date">
            <Input
              name="closingDate"
              type="date"
              defaultValue={editing?.closingDate ?? "2026-05-31"}
            />
          </FormField>
          <FormField label="Probability (%)">
            <Input
              name="probability"
              type="number"
              min="0"
              max="100"
              defaultValue={editing?.probability ?? 25}
            />
          </FormField>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{editing ? "Save changes" : "Add deal"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

export function DealsPage() {
  const { can } = useAuth();
  const canCreate = can("deals", "create");
  const canEdit = can("deals", "edit");
  const canDelete = can("deals", "delete");
  const [deals, setDeals] = useState(() => loadDeals());
  const [view, setView] = useState<"list" | "kanban">("kanban");
  const [trendMode, setTrendMode] = useState<"value" | "count">("value");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Deal | null>(null);
  const [selected, setSelected] = useState<Deal | null>(null);
  const totalDealValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const openDeals = deals.filter(
    (deal) => deal.stage !== "Won" && deal.stage !== "Lost",
  );
  const wonDeals = deals.filter((deal) => deal.stage === "Won");
  const closedDeals = deals.filter(
    (deal) => deal.stage === "Won" || deal.stage === "Lost",
  );
  const winRate =
    closedDeals.length > 0
      ? Math.round((wonDeals.length / closedDeals.length) * 1000) / 10
      : 0;
  const liveDealRings = [
    {
      label: "Total Deals",
      value: String(deals.length),
      percent: Math.min(100, deals.length * 8),
      color: "#9271D0",
      track: "#EDE9FE",
    },
    {
      label: "Open Deals",
      value: String(openDeals.length),
      percent: Math.min(
        100,
        deals.length ? Math.round((openDeals.length / deals.length) * 100) : 0,
      ),
      color: "#5685DD",
      track: "#DBEAFE",
    },
    {
      label: "Won Deals",
      value: String(wonDeals.length),
      percent: Math.min(
        100,
        deals.length ? Math.round((wonDeals.length / deals.length) * 100) : 0,
      ),
      color: "#DF9B60",
      track: "#F8EEE6",
    },
    {
      label: "Win Rate",
      value: `${winRate}%`,
      percent: Math.min(100, Math.round(winRate)),
      color: "#43A980",
      track: "#E8F5EE",
    },
  ];
  const liveBoardStages = dealBoardStages.map((stage) => {
    const stageDeals = deals.filter((deal) => deal.stage === stage.name);
    return {
      ...stage,
      count: stageDeals.length,
      amount: stageDeals.reduce((sum, deal) => sum + deal.value, 0),
    };
  });
  const createDeal = (stage?: string) => {
    setEditing(
      stage
        ? {
            id: "",
            name: "",
            customer: loadCustomers()[0]?.company ?? "",
            value: 0,
            stage,
            closingDate: "2026-05-31",
            probability: 25,
          }
        : null,
    );
    setFormOpen(true);
  };
  const editDeal = (deal: Deal) => {
    setSelected(null);
    setEditing(deal);
    setFormOpen(true);
  };
  const saveDeal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const record: Deal = {
      id:
        editing?.id && editing.id.length > 0
          ? editing.id
          : `deal-${Date.now()}`,
      name: String(form.get("name") ?? ""),
      customer: String(form.get("customer") ?? ""),
      value: Number(form.get("value") ?? 0),
      stage: String(form.get("stage") ?? editing?.stage ?? "New"),
      closingDate: String(form.get("closingDate") ?? ""),
      probability: Number(form.get("probability") ?? 0),
    };
    const next =
      editing?.id && editing.id.length > 0
        ? deals.map((deal) => (deal.id === editing.id ? record : deal))
        : [record, ...deals];
    setDeals(saveDeals(next));
    setFormOpen(false);
    recordAndToast({
      module: "deals",
      eventType:
        editing?.id && editing.id.length > 0 ? "deal.updated" : "deal.created",
      title:
        editing?.id && editing.id.length > 0 ? "Deal updated" : "Deal created",
      description: `${record.name} · ${record.customer}`,
      severity: "success",
      operationStatus: "succeeded",
      relatedRecordId: record.id,
      relatedRoute: "/deals",
      idempotencyKey: `deal-${record.id}-${Date.now()}`,
    });
  };
  const columns: DataColumn<Deal>[] = [
    {
      id: "name",
      label: "Deal name",
      render: (row) => (
        <NameLink name={row.name} onClick={() => setSelected(row)} />
      ),
    },
    { id: "customer", label: "Customer", render: (row) => row.customer },
    {
      id: "value",
      label: "Deal value",
      render: (row) => (
        <span className="font-medium">{currency(row.value)}</span>
      ),
    },
    {
      id: "stage",
      label: "Stage",
      render: (row) => <StatusBadge status={row.stage} />,
    },
    {
      id: "closing",
      label: "Expected close",
      render: (row) => (
        <span className="text-muted-foreground">{row.closingDate}</span>
      ),
    },
    {
      id: "probability",
      label: "Probability",
      render: (row) => <span>{row.probability}%</span>,
    },
    {
      id: "actions",
      label: "",
      className: "w-10 text-right",
      render: (row) => (
        <RowActions
          onView={() => setSelected(row)}
          onEdit={canEdit ? () => editDeal(row) : undefined}
          onDelete={
            canDelete
              ? () => {
                  const next = deals.filter((item) => item.id !== row.id);
                  setDeals(saveDeals(next));
                  recordAndToast({
                    module: "deals",
                    eventType: "deal.deleted",
                    title: "Deal removed",
                    description: `${row.name} was deleted.`,
                    severity: "warning",
                    operationStatus: "succeeded",
                    relatedRecordId: row.id,
                    relatedRoute: "/deals",
                    idempotencyKey: `deal-del-${row.id}-${Date.now()}`,
                  });
                }
              : undefined
          }
        />
      ),
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Deals & Pipeline"
        description="Track opportunities, move deals across stages, and close more sales."
        actions={
          canCreate ? (
            <Button
              size="sm"
              className="h-10 rounded-xl bg-[#2F6BFF] px-4 text-sm font-semibold text-white hover:bg-[#2558d9]"
              onClick={() => createDeal()}
            >
              <Plus className="h-4 w-4" />
              Add Deal
            </Button>
          ) : null
        }
      />

      <section className="metric-grid mb-5 grid grid-cols-1 sm:mb-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[minmax(200px,1.35fr)_repeat(4,minmax(140px,1fr))]">
        <LeadKpiCard
          label="Total Deal Value"
          value={currency(totalDealValue)}
          change="live"
          spark={dealMetricSpark}
          color="#43A980"
          sparkId="deal-value-spark"
        />
        {liveDealRings.map((ring) => (
          <DealRingCard key={ring.label} {...ring} />
        ))}
      </section>

      <div className="mb-5 grid min-w-0 grid-cols-1 gap-5 sm:gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.35fr)]">
        <section className="crm-card min-w-0 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-bold tracking-tight">
              Sales Pipeline
            </h2>
            <span className="rounded-full bg-[#F0FDF4] px-2.5 py-1 text-[11px] font-semibold text-[#16A34A]">
              +8.4% health
            </span>
          </div>
          <DealPipelineOverview />
        </section>

        <section className="crm-card min-w-0 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[15px] font-bold tracking-tight">
              Pipeline Board
            </h2>
            <div className="flex items-center gap-2">
              <Select defaultValue="month">
                <SelectTrigger className="h-8 w-[120px] rounded-full border-border text-xs shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                </SelectContent>
              </Select>
              <div className="inline-flex items-center rounded-xl border border-border bg-[#F8FAFC] p-0.5">
                <Button
                  variant={view === "kanban" ? "secondary" : "ghost"}
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-lg",
                    view === "kanban" && "bg-white shadow-sm",
                  )}
                  onClick={() => setView("kanban")}
                  aria-label="Kanban view"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant={view === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-lg",
                    view === "list" && "bg-white shadow-sm",
                  )}
                  onClick={() => setView("list")}
                  aria-label="List view"
                >
                  <List className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                aria-label="More options"
                onClick={() =>
                  notify.info("Board options are a frontend preview.")
                }
              >
                <Ellipsis className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {view === "list" ? (
            <DataTable
              rows={deals}
              columns={columns}
              filterKey="stage"
              filterOptions={dealStages}
              searchPlaceholder="Search deals by name or customer…"
            />
          ) : (
            <div className="max-w-full overflow-x-auto pb-1">
              <div className="flex min-w-[1280px] gap-3">
                {liveBoardStages.map((stage) => {
                  const stageDeals = deals.filter(
                    (deal) => deal.stage === stage.name,
                  );
                  return (
                    <section
                      key={stage.name}
                      className={cn(
                        "flex w-[188px] shrink-0 flex-col rounded-2xl p-2.5",
                        stage.tone,
                      )}
                    >
                      <div className="mb-2.5 px-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <i
                              className="h-2 w-2 rounded-full"
                              style={{ background: stage.accent }}
                            />
                            <h3 className="truncate text-[12px] font-semibold text-foreground">
                              {stage.name}
                            </h3>
                          </div>
                          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white/80 px-1.5 text-[10px] font-semibold text-muted-foreground">
                            {stage.count}
                          </span>
                        </div>
                        <p
                          className="mt-1 truncate text-[11px] font-bold tabular-nums text-slate-700"
                          title={currency(stage.amount)}
                        >
                          {currency(stage.amount)}
                        </p>
                      </div>
                      <div className="flex min-h-0 flex-1 flex-col gap-2">
                        {stageDeals.map((deal) => (
                          <article
                            key={deal.id}
                            className="rounded-xl border border-border/60 bg-white p-3 shadow-[var(--shadow-soft)]"
                          >
                            <button
                              type="button"
                              className="w-full truncate text-left text-[12px] font-semibold text-foreground hover:underline"
                              onClick={() => setSelected(deal)}
                            >
                              {deal.name}
                            </button>
                            <p className="mt-1 truncate text-[11px] text-muted-foreground">
                              {deal.customer}
                            </p>
                            <div className="mt-3 flex items-center justify-between gap-2">
                              <span className="text-[12px] font-bold tabular-nums text-foreground">
                                {currency(deal.value)}
                              </span>
                              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#EEF2FF] text-[9px] font-semibold text-[#4F46E5]">
                                {initials(deal.customer)}
                              </span>
                            </div>
                          </article>
                        ))}
                        {stageDeals.length === 0 && (
                          <div className="rounded-xl border border-dashed border-black/10 px-2 py-6 text-center text-[11px] text-muted-foreground">
                            No deals
                          </div>
                        )}
                        {canCreate ? (
                          <button
                            type="button"
                            className="mt-auto flex items-center justify-center gap-1 rounded-xl border border-dashed border-black/10 bg-white/50 px-2 py-2 text-[11px] font-semibold text-muted-foreground transition hover:bg-white hover:text-foreground"
                            onClick={() => createDeal(stage.name)}
                          >
                            <Plus className="h-3 w-3" />
                            Add Deal
                          </button>
                        ) : null}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)]">
        <section className="crm-card min-w-0 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[15px] font-bold tracking-tight">
              Deal Value Trend
            </h2>
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center rounded-full border border-border bg-[#F8FAFC] p-0.5">
                <Button
                  variant={trendMode === "value" ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-7 rounded-full px-3 text-xs",
                    trendMode === "value" && "bg-white shadow-sm",
                  )}
                  onClick={() => setTrendMode("value")}
                >
                  Value
                </Button>
                <Button
                  variant={trendMode === "count" ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-7 rounded-full px-3 text-xs",
                    trendMode === "count" && "bg-white shadow-sm",
                  )}
                  onClick={() => setTrendMode("count")}
                >
                  Count
                </Button>
              </div>
              <Select defaultValue="year">
                <SelectTrigger className="h-8 w-[110px] rounded-full border-border text-xs shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="last">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-full bg-[#5685DD]" />
              Open
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-full bg-[#9271D0]" />
              Won
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-full bg-[#449EA8]" />
              {trendMode === "value" ? "Value" : "Count"}
            </span>
          </div>
          <div className="h-[240px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dealValueTrend}
                margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="dealTrendOpen"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#5685DD" stopOpacity={0.35} />
                    <stop
                      offset="100%"
                      stopColor="#5685DD"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                  <linearGradient id="dealTrendWon" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9271D0" stopOpacity={0.32} />
                    <stop
                      offset="100%"
                      stopColor="#9271D0"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                  <linearGradient
                    id="dealTrendPrimary"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#449EA8" stopOpacity={0.35} />
                    <stop
                      offset="100%"
                      stopColor="#449EA8"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="#E8EEF3"
                  strokeDasharray="3 6"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#94A3B8",
                    fontSize: 10,
                    fontFamily: "Plus Jakarta Sans",
                  }}
                  dy={6}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  domain={trendMode === "value" ? [0, 100] : [0, 70]}
                  tick={{
                    fill: "#94A3B8",
                    fontSize: 10,
                    fontFamily: "Plus Jakarta Sans",
                  }}
                  tickFormatter={(value) =>
                    trendMode === "value" ? `${value}L` : String(value)
                  }
                />
                <Tooltip
                  formatter={(value, name) => [
                    trendMode === "value" && name === "value"
                      ? `₹${value}L`
                      : `${value}`,
                    name === "value"
                      ? trendMode === "value"
                        ? "Value"
                        : "Count"
                      : String(name),
                  ]}
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: "var(--border)",
                    fontSize: 12,
                    fontFamily: "Plus Jakarta Sans",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="open"
                  stroke="#5685DD"
                  strokeWidth={2.5}
                  fill="url(#dealTrendOpen)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="won"
                  stroke="#9271D0"
                  strokeWidth={2.5}
                  fill="url(#dealTrendWon)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey={trendMode}
                  stroke="#449EA8"
                  strokeWidth={2.75}
                  fill="url(#dealTrendPrimary)"
                  dot={{
                    r: 3.5,
                    fill: "#fff",
                    stroke: "#449EA8",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 5.5,
                    fill: "#449EA8",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="crm-card min-w-0 p-5">
          <h2 className="mb-4 text-[15px] font-bold tracking-tight">
            Performance
          </h2>
          <div className="mb-5 flex items-end justify-between gap-2 border-b border-[#E8EEF3] pb-4">
            {dealGauges.map((gauge) => (
              <DealSemiGauge key={gauge.name} {...gauge} />
            ))}
          </div>
          <div className="flex items-center gap-5">
            <DealProgressRing
              percent={22.8}
              color="#43A980"
              track="#E8F5EE"
              size={118}
              stroke={12}
            >
              <div className="text-center">
                <p className="text-xl font-bold tabular-nums leading-none">
                  22.8%
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Win rate
                </p>
              </div>
            </DealProgressRing>
            <ul className="min-w-0 flex-1 space-y-3">
              {dealWinRate.map((entry) => (
                <li
                  key={entry.name}
                  className="rounded-2xl bg-[#F8FAFC] px-3 py-2.5"
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2 text-[12px]">
                    <span className="flex items-center gap-2 font-medium text-muted-foreground">
                      <i
                        className="h-2 w-2 rounded-full"
                        style={{ background: entry.color }}
                      />
                      {entry.name}
                    </span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {entry.value}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${entry.percent}%`,
                        background: entry.color,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DealForm
          editing={editing}
          onSave={saveDeal}
          onCancel={() => setFormOpen(false)}
        />
      </Dialog>
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        {selected && (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{selected.name}</DialogTitle>
              <DialogDescription>{selected.customer}</DialogDescription>
            </DialogHeader>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-2xl bg-muted/50 p-4">
              <DetailItem label="Deal value" value={currency(selected.value)} />
              <DetailItem
                label="Stage"
                value={<StatusBadge status={selected.stage} />}
              />
              <DetailItem label="Expected close" value={selected.closingDate} />
              <DetailItem
                label="Probability"
                value={`${selected.probability}%`}
              />
            </dl>
            <DialogFooter>
              <Button variant="outline" onClick={() => editDeal(selected)}>
                Edit deal
              </Button>
              <Button
                onClick={() => notify.info("Deal activity is ready to update.")}
              >
                Add activity
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </AppShell>
  );
}

const clientAvatarTone = [
  "bg-[#EAF0FF] text-[#2F6BFF]",
  "bg-[#F3E8FF] text-[#7C3AED]",
  "bg-[#ECFDF3] text-[#16A34A]",
  "bg-[#FFF7ED] text-[#EA580C]",
  "bg-[#FEF3C7] text-[#D97706]",
  "bg-[#FCE7F3] text-[#DB2777]",
];

function InvoiceStatusPill({ status }: { status: string }) {
  if (status === "Paid") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F8EF] px-3 py-1.5 text-[12px] font-semibold text-[#16A34A]">
        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
        Paid
      </span>
    );
  }
  if (status === "Overdue") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDECEC] px-3 py-1.5 text-[12px] font-semibold text-[#DC2626]">
        <AlertCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
        Overdue
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF4E5] px-3 py-1.5 text-[12px] font-semibold text-[#D97706]">
      <Clock3 className="h-3.5 w-3.5" strokeWidth={2.5} />
      Pending
    </span>
  );
}

function InvoiceSummaryIllustration() {
  return (
    <svg
      viewBox="0 0 140 120"
      className="h-[112px] w-[130px] shrink-0 opacity-90"
      aria-hidden
    >
      <defs>
        <linearGradient id="inv-hero-back" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E8EEF8" />
          <stop offset="100%" stopColor="#D5E0F2" />
        </linearGradient>
        <linearGradient id="inv-hero-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F8FAFC" />
        </linearGradient>
      </defs>
      <ellipse cx="70" cy="104" rx="42" ry="8" fill="#CBD5E1" opacity="0.45" />
      <rect
        x="24"
        y="24"
        width="58"
        height="74"
        rx="12"
        fill="url(#inv-hero-back)"
        transform="rotate(-14 53 61)"
      />
      <rect
        x="42"
        y="16"
        width="60"
        height="78"
        rx="12"
        fill="url(#inv-hero-front)"
      />
      <rect x="54" y="32" width="32" height="5" rx="2.5" fill="#5685DD" />
      <rect x="54" y="44" width="26" height="4" rx="2" fill="#CBD5E1" />
      <rect x="54" y="54" width="30" height="4" rx="2" fill="#CBD5E1" />
      <rect x="54" y="64" width="20" height="4" rx="2" fill="#CBD5E1" />
      <circle cx="98" cy="78" r="18" fill="#5685DD" />
      <circle cx="98" cy="78" r="18" fill="#449EA8" opacity="0.35" />
      <path
        d="M90 78.5l5 5 11-11"
        fill="none"
        stroke="#fff"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InvoiceStatusMetricCard({
  label,
  amount,
  count,
  percent,
  icon,
  tone,
}: {
  label: string;
  amount: number;
  count: number;
  percent: number;
  icon: ReactNode;
  tone: "paid" | "pending" | "overdue";
}) {
  const styles = {
    paid: {
      icon: "bg-[#E8F5EE] text-[#2F6B4F]",
      badge: "bg-[#E8F5EE] text-[#2F6B4F]",
    },
    pending: {
      icon: "bg-[#F8EEE6] text-[#8A5A3A]",
      badge: "bg-[#F8EEE6] text-[#8A5A3A]",
    },
    overdue: {
      icon: "bg-[#F1F5F9] text-[#64748B]",
      badge: "bg-[#F1F5F9] text-[#64748B]",
    },
  }[tone];
  const amountLabel = currency(amount);
  return (
    <SummaryCard>
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "grid h-11 w-11 place-items-center rounded-full",
            styles.icon,
          )}
        >
          {icon}
        </span>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[12px] font-semibold tabular-nums",
            styles.badge,
          )}
        >
          {percent.toFixed(1)}%
        </span>
      </div>
      <div className="mt-5 min-w-0">
        <p className="truncate text-[13px] font-medium text-muted-foreground">
          {label}
        </p>
        <p
          className="summary-card__amount mt-2 text-[26px] font-bold leading-none tracking-tight text-foreground"
          title={amountLabel}
        >
          {amountLabel}
        </p>
        <p className="mt-3 text-[13px] font-medium text-muted-foreground">
          {count} {count === 1 ? "Invoice" : "Invoices"}
        </p>
      </div>
    </SummaryCard>
  );
}

function documentToListInvoice(document: InvoiceDocumentModel): Invoice {
  const status =
    document.status === "Issued" || document.status === "Partially Paid"
      ? "Pending"
      : document.status;
  return {
    id: document.id,
    number: document.number,
    customer: document.customer.company || document.customer.name,
    invoiceDate: document.invoiceDate,
    dueDate: document.dueDate,
    total: document.totals.grandTotal,
    balance: document.totals.balanceDue,
    status,
  };
}

export function InvoicesPage() {
  ensureDemoBootstrapped();
  ensureSeedInvoiceSnapshots();
  const { can } = useAuth();
  const canCreate = can("invoices", "create");
  const canEdit = can("invoices", "edit");
  const canDelete = can("invoices", "delete");
  const canIssue = can("invoices", "issue-invoice");
  const canPrint = can("invoices", "print");
  const canDownload = can("invoices", "download");
  const canRecordPayment = can("invoices", "record-payment");
  const canSettings = can("settings", "edit");
  const [invoices, setInvoices] = useState(() => {
    const index = listInvoiceIndex();
    const snapshots = listInvoiceSnapshots();
    snapshots.forEach((document) =>
      upsertInvoiceIndex(documentToListInvoice(document)),
    );
    return listInvoiceIndex().length ? listInvoiceIndex() : index;
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeDocument, setActiveDocument] =
    useState<InvoiceDocumentModel | null>(null);
  const [whatsappJob, setWhatsappJob] = useState<DeliveryJob | null>(null);
  const [emailJob, setEmailJob] = useState<DeliveryJob | null>(null);
  const [templateId, setTemplateId] = useState(
    () => loadOrgInvoicePreferences().defaultDigitalTemplateId,
  );
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const refreshInvoices = () => setInvoices(listInvoiceIndex());
  const invoiceSummary = computeInvoiceSummary(invoices);
  const clients = Array.from(
    new Set(invoices.map((invoice) => invoice.customer)),
  );
  const filtered = invoices.filter((invoice) => {
    const haystack = [invoice.number, invoice.customer, invoice.status]
      .join(" ")
      .toLowerCase();
    const matchesQuery =
      query.trim().length === 0 ||
      haystack.includes(query.trim().toLowerCase());
    const matchesTab = tab === "all" || invoice.status.toLowerCase() === tab;
    const matchesStatus =
      statusFilter === "all" || invoice.status === statusFilter;
    const matchesClient =
      clientFilter === "all" || invoice.customer === clientFilter;
    return matchesQuery && matchesTab && matchesStatus && matchesClient;
  });
  const pageSize = 7;
  const displayPageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, displayPageCount);
  const visibleRows = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const allVisibleChecked =
    visibleRows.length > 0 && visibleRows.every((row) => checked.has(row.id));
  const toggleAll = (value: boolean) => {
    setChecked((current) => {
      const next = new Set(current);
      visibleRows.forEach((row) => {
        if (value) next.add(row.id);
        else next.delete(row.id);
      });
      return next;
    });
  };
  const upsertListInvoice = (document: InvoiceDocumentModel) => {
    const record = documentToListInvoice(document);
    upsertInvoiceIndex(record);
    refreshInvoices();
    setSelected(record);
  };
  const handleIssued = (result: IssuedInvoiceResult) => {
    setCreateOpen(false);
    setActiveDocument(result.document);
    setTemplateId(result.document.templateId);
    setWhatsappJob(result.whatsapp);
    setEmailJob(result.email);
    upsertListInvoice(result.document);
    setSuccessOpen(true);
  };
  const handleDraftSaved = (document: InvoiceDocumentModel) => {
    setCreateOpen(false);
    upsertListInvoice(document);
  };
  const openDocumentTools = (invoice: Invoice) => {
    ensureSeedInvoiceSnapshots();
    const snapshot = getInvoiceSnapshot(invoice.id);
    if (!snapshot?.document) {
      notify.info(
        "Invoice document snapshot is missing. Re-issue or reset demo data.",
      );
      setSelected(invoice);
      return;
    }
    setActiveDocument(snapshot.document);
    setTemplateId(snapshot.document.templateId);
    setSelected(invoice);
  };
  const tabs = [
    { id: "all", label: `All Invoices (${invoiceSummary.totals.all})` },
    { id: "paid", label: `Paid (${invoiceSummary.totals.paid})` },
    { id: "pending", label: `Pending (${invoiceSummary.totals.pending})` },
    { id: "overdue", label: `Overdue (${invoiceSummary.totals.overdue})` },
  ];
  const paidShare = invoiceSummary.total
    ? (invoiceSummary.paid.amount / invoiceSummary.total) * 100
    : 0;
  const pendingShare = invoiceSummary.total
    ? (invoiceSummary.pending.amount / invoiceSummary.total) * 100
    : 0;
  const overdueShare = invoiceSummary.total
    ? (invoiceSummary.overdue.amount / invoiceSummary.total) * 100
    : 0;
  const paymentHistory = selected ? listPaymentsForInvoice(selected.id) : [];

  return (
    <AppShell>
      <PageHeader
        title="Invoices"
        description="Create, manage and track all your invoices in one place."
        actions={
          <>
            {canSettings ? (
              <Button
                size="sm"
                variant="outline"
                className="h-11 rounded-xl px-4 text-sm"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings2 className="h-4 w-4" />
                Invoice Settings
              </Button>
            ) : null}
            {canCreate ? (
              <Button
                size="sm"
                className="h-11 rounded-xl bg-[#2F6BFF] px-5 text-sm font-semibold text-white hover:bg-[#2558d9]"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Create Invoice
              </Button>
            ) : null}
          </>
        }
      />

      <section className="mb-5 grid min-w-0 grid-cols-1 gap-5 sm:mb-6 sm:grid-cols-2 sm:gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)_minmax(0,0.85fr)_minmax(0,0.85fr)]">
        <article className="crm-card relative min-h-[180px] p-[var(--card-pad-panel)] sm:col-span-2 xl:col-span-1 xl:min-h-[196px]">
          <div className="relative flex h-full min-w-0 items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-muted-foreground">
                Invoice Summary
              </p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Total invoiced amount this month
              </p>
              <p
                className="summary-card__amount mt-5 text-[30px] font-bold leading-none tracking-tight text-foreground"
                title={currency(invoiceSummary.total)}
              >
                {currency(invoiceSummary.total)}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-[#E8F5EE] px-2.5 py-1 text-[12px] font-semibold text-[#2F6B4F]">
                <ArrowUpRight className="h-3.5 w-3.5" />
                +14.7% vs last month
              </span>
            </div>
            <div className="hidden shrink-0 opacity-80 sm:block">
              <InvoiceSummaryIllustration />
            </div>
          </div>
        </article>

        <InvoiceStatusMetricCard
          label="Paid"
          amount={invoiceSummary.paid.amount}
          count={invoiceSummary.paid.count}
          percent={paidShare}
          tone="paid"
          icon={<Check className="h-4 w-4" strokeWidth={2.5} />}
        />
        <InvoiceStatusMetricCard
          label="Pending"
          amount={invoiceSummary.pending.amount}
          count={invoiceSummary.pending.count}
          percent={pendingShare}
          tone="pending"
          icon={<Clock3 className="h-4 w-4" strokeWidth={2.5} />}
        />
        <InvoiceStatusMetricCard
          label="Overdue"
          amount={invoiceSummary.overdue.amount}
          count={invoiceSummary.overdue.count}
          percent={overdueShare}
          tone="overdue"
          icon={<AlertCircle className="h-4 w-4" strokeWidth={2.5} />}
        />
      </section>

      <section className="crm-card min-w-0">
        <div className="border-b border-[#E8EEF3] px-5 pt-1">
          <div className="flex max-w-full gap-1 overflow-x-auto">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "shrink-0 border-b-2 px-3.5 py-3.5 text-[13px] font-semibold transition-colors",
                  tab === item.id
                    ? "border-[#2F6BFF] text-[#2F6BFF]"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
                onClick={() => {
                  setTab(item.id);
                  setPage(1);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-3 border-b border-[#E8EEF3] px-5 py-4">
          <label className="relative min-w-[220px] max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search invoices…"
              className="h-11 rounded-xl border-[#E5EAF2] bg-white pl-10 text-sm shadow-none"
            />
          </label>
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
            <Select defaultValue="month">
              <SelectTrigger className="h-11 w-[132px] rounded-xl border-[#E5EAF2] bg-white text-sm shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-11 w-[128px] rounded-xl border-[#E5EAF2] bg-white text-sm shadow-none">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {["Paid", "Pending", "Overdue"].map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={clientFilter}
              onValueChange={(value) => {
                setClientFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-11 w-[140px] rounded-xl border-[#E5EAF2] bg-white text-sm shadow-none">
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client} value={client}>
                    {client}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-11 rounded-xl border-[#E5EAF2] bg-white px-3.5 text-sm shadow-none"
              onClick={() =>
                notify.info("Advanced filters are a frontend preview.")
              }
            >
              <Filter className="h-3.5 w-3.5" />
              Filter
            </Button>
            {canCreate ? (
              <Button
                size="sm"
                className="h-11 rounded-xl bg-[#2F6BFF] px-4 text-sm font-semibold text-white hover:bg-[#2558d9]"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Create Invoice
              </Button>
            ) : null}
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
            <thead className="bg-[#F8FAFC] text-xs font-semibold text-muted-foreground">
              <tr>
                <th className="w-10 px-3 py-2.5">
                  <Checkbox
                    checked={allVisibleChecked}
                    onCheckedChange={(value) => toggleAll(Boolean(value))}
                    aria-label="Select all visible invoices"
                  />
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  Invoice ID
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  Client Name
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  Invoice Date
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  Due Date
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  Amount
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  Status
                </th>
                <th className="w-[108px] px-2 py-2.5 text-right" />
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((invoice, index) => (
                <tr
                  key={invoice.id}
                  className="border-t border-border/70 transition-colors hover:bg-muted/40"
                >
                  <td className="whitespace-nowrap px-3 py-2.5 align-middle">
                    <Checkbox
                      checked={checked.has(invoice.id)}
                      onCheckedChange={(value) => {
                        setChecked((current) => {
                          const next = new Set(current);
                          if (value) next.add(invoice.id);
                          else next.delete(invoice.id);
                          return next;
                        });
                      }}
                      aria-label={`Select ${invoice.number}`}
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 align-middle">
                    <button
                      type="button"
                      className="inline-flex items-center gap-3 text-left"
                      onClick={() => setSelected(invoice)}
                    >
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#EAF0FF] text-[#2F6BFF]">
                        <FileText className="h-4 w-4" />
                      </span>
                      <span className="font-semibold text-foreground hover:underline">
                        {invoice.number}
                      </span>
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 align-middle">
                    <span className="inline-flex items-center gap-3">
                      <span
                        className={cn(
                          "grid h-10 w-10 place-items-center rounded-full text-[13px] font-semibold",
                          clientAvatarTone[index % clientAvatarTone.length],
                        )}
                      >
                        {(invoice.customer[0] ?? "?").toUpperCase()}
                      </span>
                      <span className="font-medium text-foreground">
                        {invoice.customer}
                      </span>
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 align-middle text-muted-foreground">
                    {invoice.invoiceDate}
                  </td>
                  <td
                    className={cn(
                      "whitespace-nowrap px-3 py-2.5 align-middle font-medium",
                      invoice.status === "Overdue"
                        ? "text-[#DC2626]"
                        : "text-foreground",
                    )}
                  >
                    {invoice.dueDate}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right align-middle font-semibold tabular-nums text-foreground">
                    {currency(invoice.total)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 align-middle">
                    <InvoiceStatusPill status={invoice.status} />
                  </td>
                  <td className="w-[108px] whitespace-nowrap px-2 py-2 text-right align-middle">
                    <RowActions
                      onView={() => setSelected(invoice)}
                      onEdit={
                        canEdit
                          ? () =>
                              notify.info(
                                "Invoice editing is available in this preview.",
                              )
                          : undefined
                      }
                      onDelete={
                        canDelete
                          ? () => {
                              setInvoices((current) =>
                                current.filter(
                                  (item) => item.id !== invoice.id,
                                ),
                              );
                              recordAndToast({
                                module: "invoices",
                                eventType: "invoice.deleted",
                                title: "Invoice removed",
                                description: `${invoice.number} removed from preview.`,
                                severity: "warning",
                                operationStatus: "succeeded",
                                relatedRecordId: invoice.id,
                                relatedRoute: "/invoices",
                                idempotencyKey: `invoice-del-${invoice.id}-${Date.now()}`,
                              });
                            }
                          : undefined
                      }
                    />
                  </td>
                </tr>
              ))}
              {visibleRows.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-muted-foreground"
                  >
                    No invoices match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-1 border-t border-[#E8EEF3] px-5 py-3.5">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous page"
            className="h-9 w-9 rounded-lg border-[#E5EAF2]"
            disabled={currentPage <= 1}
            onClick={() => setPage((value) => Math.max(value - 1, 1))}
          >
            <ChevronLeft />
          </Button>
          {Array.from(
            { length: displayPageCount },
            (_, index) => index + 1,
          ).map((pageNumber) => (
            <Button
              key={pageNumber}
              variant={pageNumber === currentPage ? "default" : "outline"}
              size="icon"
              className={cn(
                "h-9 w-9 rounded-lg text-xs",
                pageNumber === currentPage
                  ? "bg-[#2F6BFF] hover:bg-[#2558d9]"
                  : "border-[#E5EAF2]",
              )}
              onClick={() => setPage(pageNumber)}
            >
              {pageNumber}
            </Button>
          ))}
          <Button
            variant="outline"
            size="icon"
            aria-label="Next page"
            className="h-9 w-9 rounded-lg border-[#E5EAF2]"
            disabled={currentPage >= displayPageCount}
            onClick={() =>
              setPage((value) => Math.min(value + 1, displayPageCount))
            }
          >
            <ChevronRight />
          </Button>
        </div>
      </section>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <InvoiceForm
          onCancel={() => setCreateOpen(false)}
          onDraftSaved={handleDraftSaved}
          onIssued={handleIssued}
          canSaveDraft={canCreate || canEdit}
          canIssue={canIssue}
        />
      </Dialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Invoice Settings</DialogTitle>
            <DialogDescription>
              Templates, company profile, numbering and delivery preferences.
            </DialogDescription>
          </DialogHeader>
          <InvoiceSettingsPanel onClose={() => setSettingsOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={
          successOpen &&
          activeDocument !== null &&
          whatsappJob !== null &&
          emailJob !== null
        }
        onOpenChange={setSuccessOpen}
      >
        {activeDocument && whatsappJob && emailJob ? (
          <InvoiceSuccessDialog
            document={activeDocument}
            whatsapp={whatsappJob}
            email={emailJob}
            onView={() => {
              setSuccessOpen(false);
              setPreviewOpen(true);
            }}
            onChooseTemplate={() => {
              setSuccessOpen(false);
              setTemplateOpen(true);
            }}
            onPrint={() => {
              setSuccessOpen(false);
              setPrintOpen(true);
            }}
            onDone={() => setSuccessOpen(false)}
            onDeliveryUpdate={(whatsapp, email) => {
              setWhatsappJob(whatsapp);
              setEmailJob(email);
            }}
          />
        ) : null}
      </Dialog>

      <Dialog
        open={templateOpen && activeDocument !== null}
        onOpenChange={setTemplateOpen}
      >
        {activeDocument ? (
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
            <DialogHeader>
              <DialogTitle>Choose Template</DialogTitle>
              <DialogDescription>
                Switch templates without changing invoice data. Preview updates
                immediately.
              </DialogDescription>
            </DialogHeader>
            <TemplateSelector
              document={activeDocument}
              selectedTemplateId={templateId}
              defaultTemplateId={
                loadOrgInvoicePreferences().defaultDigitalTemplateId
              }
              visibility={loadOrgInvoicePreferences().fieldVisibility}
              onSelect={(id) => {
                setTemplateId(id);
                try {
                  if (activeDocument) {
                    const updated = persistInvoiceTemplateChoice(
                      activeDocument.id,
                      id,
                    );
                    setActiveDocument(updated);
                    notify.info("Template saved on this invoice snapshot.");
                  }
                } catch {
                  setActiveDocument((current) =>
                    current ? { ...current, templateId: id } : current,
                  );
                  notify.info(
                    "Preview updated. Snapshot not found for persistence.",
                  );
                }
              }}
              onSetDefault={(id) => {
                updateOrgInvoicePreferences({
                  defaultDigitalTemplateId: id,
                  defaultPrintTemplateId: id,
                });
                notify.info("Default invoice template updated.");
              }}
            />
          </DialogContent>
        ) : null}
      </Dialog>

      <Dialog
        open={previewOpen && activeDocument !== null}
        onOpenChange={setPreviewOpen}
      >
        {activeDocument ? (
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Invoice {activeDocument.number}</DialogTitle>
              <DialogDescription>
                Live PDF preview using the selected template.
              </DialogDescription>
            </DialogHeader>
            <InvoicePreview
              document={activeDocument}
              templateId={templateId}
              visibility={loadOrgInvoicePreferences().fieldVisibility}
            />
            <DialogFooter>
              {canEdit ? (
                <Button variant="outline" onClick={() => setTemplateOpen(true)}>
                  Choose Template
                </Button>
              ) : null}
              {canPrint ? (
                <Button variant="outline" onClick={() => setPrintOpen(true)}>
                  Print
                </Button>
              ) : null}
              {canDownload ? (
                <Button
                  className="bg-[#2F6BFF] hover:bg-[#2558d9]"
                  onClick={() =>
                    void downloadInvoicePdf(activeDocument, templateId)
                      .then(() => notify.info("PDF downloaded."))
                      .catch(() => notify.info("Unable to download PDF."))
                  }
                >
                  Download PDF
                </Button>
              ) : null}
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>

      <Dialog
        open={printOpen && activeDocument !== null}
        onOpenChange={setPrintOpen}
      >
        {activeDocument ? (
          <PrintDialog
            document={{ ...activeDocument, templateId }}
            onClose={() => setPrintOpen(false)}
          />
        ) : null}
      </Dialog>

      <Dialog
        open={selected !== null && !previewOpen && !successOpen}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        {selected && (
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Invoice {selected.number}</DialogTitle>
              <DialogDescription>
                {selected.customer} · Issued {selected.invoiceDate}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 rounded-2xl border border-border bg-card p-4 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
                <div>
                  <p className="text-sm font-semibold">Yaglob Studio</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Mumbai, Maharashtra · billing@yaglob.co
                  </p>
                </div>
                <InvoiceStatusPill status={selected.status} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-medium uppercase text-muted-foreground">
                    Bill to
                  </p>
                  <p className="mt-1 text-xs font-semibold">
                    {selected.customer}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Accounts payable
                    <br />
                    India
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-[10px] text-muted-foreground">
                    Invoice date{" "}
                    <span className="font-medium text-foreground">
                      {selected.invoiceDate}
                    </span>
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Due date{" "}
                    <span className="font-medium text-foreground">
                      {selected.dueDate}
                    </span>
                  </p>
                </div>
              </div>
              <div className="ml-auto grid w-full max-w-xs gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span>{currency(selected.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Balance due</span>
                  <span className="font-semibold">
                    {currency(selected.balance)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap items-center gap-0.5">
                {(canDownload || canPrint) && (
                  <ActionIconButton
                    icon={FileText}
                    label="View PDF"
                    onClick={() => {
                      openDocumentTools(selected);
                      setPreviewOpen(true);
                    }}
                  />
                )}
                {canPrint ? (
                  <ActionIconButton
                    icon={ACTION_ICONS.print}
                    label="Print invoice"
                    onClick={() => {
                      openDocumentTools(selected);
                      setPrintOpen(true);
                    }}
                  />
                ) : null}
                <ActionIconButton
                  icon={ACTION_ICONS.whatsapp}
                  label="WhatsApp delivery"
                  onClick={() =>
                    notify.info(
                      "WhatsApp delivery uses Invoice Settings + issue workflow.",
                    )
                  }
                />
                <ActionIconButton
                  icon={ACTION_ICONS.email}
                  label="Email delivery"
                  onClick={() =>
                    notify.info(
                      "Email delivery uses Invoice Settings + issue workflow.",
                    )
                  }
                />
              </div>
              {canEdit ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg"
                  onClick={() => {
                    openDocumentTools(selected);
                    setTemplateOpen(true);
                  }}
                >
                  Choose Template
                </Button>
              ) : null}
              {can("payments", "view") || canRecordPayment ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg"
                  onClick={() => setPaymentHistoryOpen(true)}
                >
                  Payment history
                </Button>
              ) : null}
              {selected.balance > 0 && canRecordPayment ? (
                <Button
                  size="sm"
                  className="h-8 rounded-lg"
                  onClick={() => setPaymentOpen(true)}
                >
                  <CreditCard className="h-4 w-4" />
                  Record payment
                </Button>
              ) : null}
            </div>
          </DialogContent>
        )}
      </Dialog>
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>
              {selected?.number} · Balance{" "}
              {selected ? currency(selected.balance) : ""}
            </DialogDescription>
          </DialogHeader>
          <PaymentForm
            maxAmount={selected?.balance ?? 0}
            onCancel={() => setPaymentOpen(false)}
            onSubmit={(payload) => {
              if (!selected) return;
              try {
                const result = recordInvoicePayment({
                  invoiceId: selected.id,
                  invoiceNumber: selected.number,
                  customerName: selected.customer,
                  ...payload,
                });
                refreshInvoices();
                const next =
                  listInvoiceIndex().find(
                    (invoice) => invoice.id === selected.id,
                  ) ?? selected;
                setSelected(next);
                if (result.document) setActiveDocument(result.document);
                setPaymentOpen(false);
                recordAndToast({
                  module: "payments",
                  eventType: "payment.recorded",
                  title: "Payment recorded",
                  description: `${selected.number} · ${selected.customer}`,
                  severity: "success",
                  operationStatus: "succeeded",
                  relatedRecordId: selected.id,
                  relatedRoute: "/payments",
                  idempotencyKey: `payment-${selected.id}-${Date.now()}`,
                });
              } catch (error) {
                notify.error(
                  error instanceof Error
                    ? error.message
                    : "Unable to record payment.",
                );
              }
            }}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={paymentHistoryOpen} onOpenChange={setPaymentHistoryOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment history</DialogTitle>
            <DialogDescription>{selected?.number}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {paymentHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No payments recorded yet.
              </p>
            ) : (
              paymentHistory.map((payment) => (
                <div
                  key={payment.id}
                  className="rounded-xl border border-border px-3 py-2 text-xs"
                >
                  <div className="flex justify-between font-semibold">
                    <span>{currency(payment.amount)}</span>
                    <span>{payment.paidAt}</span>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {payment.method} · {payment.reference}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {can("payments", "download") ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7"
                        onClick={() =>
                          void downloadPaymentReceipt(payment)
                            .then(() => notify.info("Receipt downloaded."))
                            .catch(() =>
                              notify.info("Unable to download receipt."),
                            )
                        }
                      >
                        Download receipt
                      </Button>
                    ) : null}
                    {can("payments", "print") ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7"
                        onClick={() =>
                          void printPaymentReceipt(payment)
                            .then(() =>
                              notify.info("Receipt print dialog opened."),
                            )
                            .catch((error) =>
                              notify.info(
                                error instanceof Error
                                  ? error.message
                                  : "Unable to print receipt.",
                              ),
                            )
                        }
                      >
                        Print receipt
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentHistoryOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function PaymentForm({
  maxAmount,
  onCancel,
  onSubmit,
}: {
  maxAmount: number;
  onCancel: () => void;
  onSubmit: (payload: {
    amount: number;
    method: string;
    reference: string;
  }) => void;
}) {
  const [method, setMethod] = useState("Bank transfer");
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        onSubmit({
          amount: Number(form.get("amount") ?? 0),
          method,
          reference: String(form.get("reference") ?? ""),
        });
      }}
    >
      <FormField label="Amount received (₹)" required>
        <Input
          name="amount"
          type="number"
          min="1"
          max={maxAmount}
          step="0.01"
          defaultValue={maxAmount}
          required
        />
      </FormField>
      <FormField label="Payment method">
        <Select value={method} onValueChange={setMethod}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["Bank transfer", "UPI", "Cash", "Card"].map((item) => (
              <SelectItem value={item} key={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label="Transaction reference" required>
        <Input name="reference" placeholder="UTR / cheque / txn id" required />
      </FormField>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save payment</Button>
      </DialogFooter>
    </form>
  );
}
