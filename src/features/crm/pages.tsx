import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  ChevronDown,
  CircleDollarSign,
  ContactRound,
  CreditCard,
  FileText,
  LayoutGrid,
  List,
  Mail,
  MessageCircle,
  Percent,
  Phone,
  Plus,
  ReceiptText,
  Sparkles,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  customerSeed,
  dealSeed,
  invoiceSeed,
  leadSeed,
  leadSources,
  pipelineStages,
  revenueSeries,
  type Customer,
  type Deal,
  type Invoice,
  type Lead,
} from "@/features/crm/data";
import {
  AppShell,
  currency,
  DataTable,
  type DataColumn,
  FormField,
  ImportExportActions,
  MetricCard,
  MetricGrid,
  PageHeader,
  Panel,
  RowActions,
  StatusBadge,
} from "@/features/crm/shared";

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return <div className="min-w-0"><dt className="text-[10px] font-medium uppercase text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-xs font-medium">{value || "—"}</dd></div>;
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <h3 className="mb-3 text-xs font-semibold">{children}</h3>;
}

function NameLink({ name, onClick }: { name: string; onClick: () => void }) {
  return <Button variant="link" size="sm" className="h-auto max-w-full justify-start px-0 py-0 text-left text-xs font-medium text-foreground" onClick={onClick}>{name}</Button>;
}

function DashboardActions() {
  return (
    <div className="flex items-center gap-2">
      <Select defaultValue="30-days">
        <SelectTrigger className="h-8 w-[132px] text-xs"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="7-days">Last 7 days</SelectItem><SelectItem value="30-days">Last 30 days</SelectItem><SelectItem value="quarter">This quarter</SelectItem></SelectContent>
      </Select>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button size="sm" className="h-8 px-2.5 sm:px-3"><Plus className="h-3.5 w-3.5" /><span className="hidden sm:inline">Quick add</span><ChevronDown className="hidden h-3.5 w-3.5 sm:block" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem asChild><Link to="/leads">Add lead</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link to="/customers">Add customer</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link to="/deals">Add deal</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link to="/invoices">Create invoice</Link></DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function DashboardPage() {
  const recentLeads = leadSeed.slice(0, 5);
  const recentInvoices = invoiceSeed.slice(0, 4);
  const leadColumns: DataColumn<Lead>[] = [
    { id: "lead", label: "Lead", render: (row) => <Link to="/leads" className="font-medium text-foreground hover:underline">{row.name}</Link> },
    { id: "company", label: "Company", render: (row) => <span className="text-muted-foreground">{row.company}</span> },
    { id: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
    { id: "value", label: "Lead value", render: (row) => <span className="font-medium tabular-nums">{currency(row.value)}</span> },
  ];
  const invoiceColumns: DataColumn<Invoice>[] = [
    { id: "number", label: "Invoice", render: (row) => <Link to="/invoices" className="font-medium text-foreground hover:underline">{row.number}</Link> },
    { id: "customer", label: "Customer", render: (row) => row.customer },
    { id: "total", label: "Amount", render: (row) => currency(row.total) },
    { id: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <AppShell>
      <PageHeader title="Dashboard" description="Good morning, Jane. Here’s what’s happening across your workspace." actions={<DashboardActions />} />
      <MetricGrid>
        <MetricCard icon={<CircleDollarSign className="h-4 w-4" />} label="Total revenue" value="₹12,84,500" change="12.8%" />
        <MetricCard icon={<UsersRound className="h-4 w-4" />} label="Total customers" value="1,284" change="8.2%" />
        <MetricCard icon={<BriefcaseBusiness className="h-4 w-4" />} label="Deals closed" value="48" change="6.4%" />
        <MetricCard icon={<Percent className="h-4 w-4" />} label="Conversion rate" value="24.8%" change="2.1%" positive={false} />
      </MetricGrid>

      <div className="mb-5 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.85fr)]">
        <Panel title="Revenue overview" action={<span className="text-[10px] text-muted-foreground">Last 6 months · ₹ thousands</span>}>
          <div className="h-[250px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueSeries} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.14} /><stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 4" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value: number) => `${value}k`} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                <Tooltip formatter={(value) => [`₹${value}k`, "Revenue"]} contentStyle={{ borderRadius: 6, borderColor: "var(--border)", fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-chart-1)" strokeWidth={2} fill="url(#revenueFill)" />
                <Area type="monotone" dataKey="costs" stroke="var(--color-chart-3)" strokeWidth={1.5} strokeDasharray="4 4" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center gap-4 text-[10px] text-muted-foreground"><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-chart-1" />Revenue</span><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-chart-3" />Previous period</span></div>
        </Panel>

        <Panel title="Lead sources" action={<span className="text-[10px] text-muted-foreground">This month</span>}>
          <div className="relative mx-auto h-[190px] max-w-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={leadSources} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={2} stroke="var(--card)" strokeWidth={2}>
                {leadSources.map((entry, index) => <Cell key={entry.name} fill={`var(--color-chart-${index + 1})`} />)}
              </Pie><Tooltip formatter={(value) => [`${value}%`, "Share"]} contentStyle={{ borderRadius: 6, borderColor: "var(--border)", fontSize: 12 }} /></PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-semibold">86</span><span className="text-[10px] text-muted-foreground">new leads</span></div>
          </div>
          <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-2">
            {leadSources.map((source, index) => <div key={source.name} className="flex min-w-0 items-center justify-between gap-2 text-[10px]"><span className="flex min-w-0 items-center gap-1.5 text-muted-foreground"><i className={`h-2 w-2 shrink-0 rounded-full bg-chart-${index + 1}`} /><span className="truncate">{source.name}</span></span><span className="shrink-0 font-medium">{source.value}%</span></div>)}
          </div>
        </Panel>
      </div>

      <div className="mb-5 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.85fr)]">
        <Panel title="Sales pipeline" action={<Link to="/deals" className="text-[11px] font-medium text-muted-foreground hover:text-foreground">View pipeline</Link>}>
          <div className="h-[205px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineStages} layout="vertical" margin={{ top: 2, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 4" />
                <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(value: number) => `₹${value / 1000}k`} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={86} axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                <Tooltip formatter={(value) => [currency(Number(value)), "Pipeline value"]} contentStyle={{ borderRadius: 6, borderColor: "var(--border)", fontSize: 12 }} />
                <Bar dataKey="amount" fill="var(--color-chart-2)" radius={[0, 3, 3, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Upcoming follow-ups" action={<CalendarClock className="h-4 w-4 text-muted-foreground" />}>
          <div className="divide-y divide-border">
            {leadSeed.slice(0, 4).map((lead) => <div key={lead.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5 first:pt-0 last:pb-0"><div className="min-w-0"><p className="truncate text-xs font-medium">{lead.name}</p><p className="truncate text-[10px] text-muted-foreground">{lead.company}</p></div><span className="shrink-0 text-[10px] text-muted-foreground">{lead.nextFollowUp}</span></div>)}
          </div>
        </Panel>
      </div>

      <div className="mb-5 grid min-w-0 gap-4 xl:grid-cols-2">
        <div className="min-w-0 space-y-2"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Recent leads</h2><Link to="/leads" className="text-[11px] text-muted-foreground hover:text-foreground">View all</Link></div><DataTable rows={recentLeads} columns={leadColumns} compact searchPlaceholder="Search recent leads…" /></div>
        <div className="min-w-0 space-y-2"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Recent invoices</h2><Link to="/invoices" className="text-[11px] text-muted-foreground hover:text-foreground">View all</Link></div><DataTable rows={recentInvoices} columns={invoiceColumns} compact searchPlaceholder="Search recent invoices…" /></div>
      </div>

      <Panel title="Recent activity" action={<Activity className="h-4 w-4 text-muted-foreground" />}>
        <div className="grid gap-x-5 md:grid-cols-2">
          {[
            ["Jane Mitchell", "sent a proposal to Monsoon Goods", "12 min ago"],
            ["Payment received", "INV-2026-041 · Northstar Studio", "1 hour ago"],
            ["Mira Shah", "was added as a new lead", "3 hours ago"],
            ["New deal created", "Clinic photography · Orbit Health", "Yesterday"],
          ].map(([title, detail, time]) => <div key={title + detail} className="grid grid-cols-[8px_minmax(0,1fr)_auto] items-start gap-3 border-b border-border/70 py-3 last:border-0 md:nth-last-2:border-0"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-chart-3" /><div className="min-w-0"><p className="truncate text-xs font-medium">{title}</p><p className="mt-0.5 truncate text-[10px] text-muted-foreground">{detail}</p></div><span className="shrink-0 text-[10px] text-muted-foreground">{time}</span></div>)}
        </div>
      </Panel>
    </AppShell>
  );
}

function LeadForm({ editing, onSave, onCancel }: { editing: Lead | null; onSave: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void }) {
  return (
    <DialogContent key={editing?.id ?? "new-lead"} className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
      <DialogHeader><DialogTitle>{editing ? "Edit lead" : "Add lead"}</DialogTitle><DialogDescription>Keep contact details and the next step together.</DialogDescription></DialogHeader>
      <form onSubmit={onSave} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Lead name"><Input name="name" defaultValue={editing?.name} required placeholder="Full name" /></FormField>
          <FormField label="Company"><Input name="company" defaultValue={editing?.company} required placeholder="Company name" /></FormField>
          <FormField label="Phone"><Input name="phone" defaultValue={editing?.phone} placeholder="Phone number" /></FormField>
          <FormField label="Email"><Input name="email" type="email" defaultValue={editing?.email} placeholder="name@company.com" /></FormField>
          <FormField label="Lead source"><Input name="source" defaultValue={editing?.source} placeholder="Website, referral…" /></FormField>
          <FormField label="Lead value (₹)"><Input name="value" type="number" min="0" defaultValue={editing?.value ?? 0} /></FormField>
          <FormField label="Status"><Select name="status" defaultValue={editing?.status ?? "New"}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["New", "Contacted", "Qualified", "Proposal sent", "Converted"].map((status) => <SelectItem value={status} key={status}>{status}</SelectItem>)}</SelectContent></Select></FormField>
          <FormField label="Next follow-up"><Input name="nextFollowUp" defaultValue={editing?.nextFollowUp ?? "08 May, 2026"} /></FormField>
        </div>
        <FormField label="Notes"><Textarea name="notes" defaultValue={editing?.notes} placeholder="Add context for the next conversation" /></FormField>
        <DialogFooter><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit">{editing ? "Save changes" : "Add lead"}</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}

function LeadDetail({ lead, onEdit, onConvert }: { lead: Lead; onEdit: () => void; onConvert: () => void }) {
  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
      <DialogHeader><div className="flex items-start justify-between gap-4 pr-7"><div className="min-w-0"><DialogTitle>{lead.name}</DialogTitle><DialogDescription className="mt-1">{lead.company}</DialogDescription></div><StatusBadge status={lead.status} /></div></DialogHeader>
      <dl className="grid gap-x-6 gap-y-4 rounded-md bg-muted/50 p-4 sm:grid-cols-2"><DetailItem label="Phone" value={lead.phone} /><DetailItem label="Email" value={lead.email} /><DetailItem label="Lead source" value={lead.source} /><DetailItem label="Potential value" value={currency(lead.value)} /><DetailItem label="Next follow-up" value={lead.nextFollowUp} /><DetailItem label="Status" value={<StatusBadge status={lead.status} />} /></dl>
      <div><SectionLabel>Notes</SectionLabel><p className="text-xs leading-5 text-muted-foreground">{lead.notes || "No notes yet."}</p></div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => toast(`Calling ${lead.name} is a frontend preview.`)}><Phone />Call</Button>
        <Button variant="outline" size="sm" onClick={() => toast(`Email to ${lead.email} is a frontend preview.`)}><Mail />Email</Button>
        <Button variant="outline" size="sm" onClick={() => toast(`WhatsApp for ${lead.name} is a frontend preview.`)}><MessageCircle />WhatsApp</Button>
      </div>
      <DialogFooter className="gap-2 sm:gap-2"><Button variant="outline" onClick={onEdit}>Edit lead</Button><Button onClick={onConvert}><Check />Convert to customer</Button></DialogFooter>
    </DialogContent>
  );
}

export function LeadsPage() {
  const [leads, setLeads] = useState(leadSeed);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [selected, setSelected] = useState<Lead | null>(null);
  const createLead = () => { setEditing(null); setFormOpen(true); };
  const editLead = (lead: Lead) => { setSelected(null); setEditing(lead); setFormOpen(true); };
  const saveLead = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const record: Lead = {
      id: editing?.id ?? `lead-${Date.now()}`,
      name: String(form.get("name") ?? ""), company: String(form.get("company") ?? ""), phone: String(form.get("phone") ?? ""), email: String(form.get("email") ?? ""), source: String(form.get("source") ?? "Website"), status: String(form.get("status") ?? "New"), value: Number(form.get("value") ?? 0), nextFollowUp: String(form.get("nextFollowUp") ?? "—"), notes: String(form.get("notes") ?? ""),
    };
    setLeads((current) => editing ? current.map((lead) => lead.id === editing.id ? record : lead) : [record, ...current]);
    setFormOpen(false);
    toast(editing ? "Lead updated." : "Lead added to this preview.");
  };
  const convertLead = (lead: Lead) => {
    setLeads((current) => current.map((item) => item.id === lead.id ? { ...item, status: "Converted" } : item));
    setSelected(null);
    toast(`${lead.name} marked as converted.`);
  };
  const columns: DataColumn<Lead>[] = [
    { id: "name", label: "Lead name", render: (row) => <NameLink name={row.name} onClick={() => setSelected(row)} /> },
    { id: "company", label: "Company", render: (row) => row.company },
    { id: "phone", label: "Phone", render: (row) => <span className="text-muted-foreground">{row.phone}</span> },
    { id: "email", label: "Email", render: (row) => <span className="text-muted-foreground">{row.email}</span> },
    { id: "source", label: "Lead source", render: (row) => row.source },
    { id: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
    { id: "value", label: "Lead value", render: (row) => <span className="font-medium tabular-nums">{currency(row.value)}</span> },
    { id: "follow-up", label: "Next follow-up", render: (row) => <span className="text-muted-foreground">{row.nextFollowUp}</span> },
    { id: "actions", label: "", className: "w-10 text-right", render: (row) => <RowActions onView={() => setSelected(row)} onEdit={() => editLead(row)} onDelete={() => { setLeads((current) => current.filter((item) => item.id !== row.id)); toast("Lead removed from this preview."); }} /> },
  ];
  const statuses = ["New", "Contacted", "Qualified", "Proposal sent", "Converted"];

  return (
    <AppShell>
      <PageHeader title="Leads" description="Keep new opportunities moving with a clear view of every next step." actions={<><ImportExportActions /><Button size="sm" className="h-8" onClick={createLead}><Plus />Add lead</Button></>} />
      <MetricGrid columns={5}>
        <MetricCard icon={<ContactRound className="h-4 w-4" />} label="Total leads" value={String(leads.length + 126)} change="9.4%" />
        <MetricCard icon={<Sparkles className="h-4 w-4" />} label="New leads" value="38" change="12.1%" />
        <MetricCard icon={<Phone className="h-4 w-4" />} label="Contacted" value="52" change="4.8%" />
        <MetricCard icon={<Check className="h-4 w-4" />} label="Qualified" value="24" change="7.3%" />
        <MetricCard icon={<TrendingUp className="h-4 w-4" />} label="Converted" value="12" change="2.6%" positive={false} />
      </MetricGrid>
      <DataTable rows={leads} columns={columns} filterKey="status" filterOptions={statuses} searchPlaceholder="Search leads by name, company, email…" />

      <Dialog open={formOpen} onOpenChange={setFormOpen}><LeadForm editing={editing} onSave={saveLead} onCancel={() => setFormOpen(false)} /></Dialog>
      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        {selected && <LeadDetail lead={selected} onEdit={() => editLead(selected)} onConvert={() => convertLead(selected)} />}
      </Dialog>
    </AppShell>
  );
}

function CustomerForm({ editing, onSave, onCancel }: { editing: Customer | null; onSave: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void }) {
  return (
    <DialogContent key={editing?.id ?? "new-customer"} className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader><DialogTitle>{editing ? "Edit customer" : "Add customer"}</DialogTitle><DialogDescription>Contact, billing and account information.</DialogDescription></DialogHeader>
      <form onSubmit={onSave} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Customer name"><Input name="name" defaultValue={editing?.name} required /></FormField>
          <FormField label="Company"><Input name="company" defaultValue={editing?.company} required /></FormField>
          <FormField label="Phone"><Input name="phone" defaultValue={editing?.phone} /></FormField>
          <FormField label="Email"><Input name="email" type="email" defaultValue={editing?.email} /></FormField>
          <FormField label="Total business (₹)"><Input name="business" type="number" min="0" defaultValue={editing?.business ?? 0} /></FormField>
          <FormField label="Outstanding balance (₹)"><Input name="outstanding" type="number" min="0" defaultValue={editing?.outstanding ?? 0} /></FormField>
          <FormField label="Status"><Select name="status" defaultValue={editing?.status ?? "Active"}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Active", "New", "Payment due", "Inactive"].map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></FormField>
          <FormField label="GSTIN"><Input name="gstin" defaultValue={editing?.gstin} /></FormField>
        </div>
        <FormField label="Billing address"><Textarea name="billingAddress" defaultValue={editing?.billingAddress} rows={2} /></FormField>
        <FormField label="Shipping address"><Textarea name="shippingAddress" defaultValue={editing?.shippingAddress} rows={2} /></FormField>
        <FormField label="Notes"><Textarea name="notes" defaultValue={editing?.notes} rows={2} /></FormField>
        <DialogFooter><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit">{editing ? "Save changes" : "Add customer"}</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}

function CustomerDetail({ customer, onEdit }: { customer: Customer; onEdit: () => void }) {
  const invoices = invoiceSeed.filter((invoice) => invoice.customer === customer.company);
  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader><div className="flex items-start justify-between gap-4 pr-7"><div className="min-w-0"><DialogTitle>{customer.name}</DialogTitle><DialogDescription className="mt-1">{customer.company}</DialogDescription></div><StatusBadge status={customer.status} /></div></DialogHeader>
      <section><SectionLabel>Contact details</SectionLabel><dl className="grid gap-x-6 gap-y-3 rounded-md bg-muted/50 p-4 sm:grid-cols-2"><DetailItem label="Phone" value={customer.phone} /><DetailItem label="Email" value={customer.email} /><DetailItem label="Total business" value={currency(customer.business)} /><DetailItem label="Outstanding balance" value={currency(customer.outstanding)} /></dl></section>
      <div className="grid gap-4 sm:grid-cols-2"><section><SectionLabel>Billing address</SectionLabel><p className="text-xs leading-5 text-muted-foreground">{customer.billingAddress}</p></section><section><SectionLabel>Shipping address</SectionLabel><p className="text-xs leading-5 text-muted-foreground">{customer.shippingAddress}</p></section></div>
      <section><SectionLabel>Tax details</SectionLabel><dl className="rounded-md bg-muted/50 p-3"><DetailItem label="GSTIN" value={customer.gstin} /></dl></section>
      <section><SectionLabel>Invoice history</SectionLabel>{invoices.length > 0 ? <div className="divide-y divide-border rounded-md border border-border">{invoices.map((invoice) => <div key={invoice.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-3 py-2.5 text-xs"><span className="font-medium">{invoice.number}</span><span className="text-muted-foreground">{currency(invoice.total)}</span><StatusBadge status={invoice.status} /></div>)}</div> : <p className="text-xs text-muted-foreground">No invoices yet.</p>}</section>
      <section><SectionLabel>Payment history</SectionLabel><div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-md border border-border p-3 text-xs"><span className="text-muted-foreground">Last payment received</span><span className="font-medium">{customer.outstanding === 0 ? "22 Apr, 2026 · Settled" : "18 Apr, 2026 · Part payment"}</span></div></section>
      <section><SectionLabel>Notes</SectionLabel><p className="text-xs leading-5 text-muted-foreground">{customer.notes || "No notes yet."}</p></section>
      <DialogFooter><Button variant="outline" onClick={onEdit}>Edit customer</Button><Button onClick={() => toast("Customer statement is ready for export.")}><FileText />Customer statement</Button></DialogFooter>
    </DialogContent>
  );
}

export function CustomersPage() {
  const [customers, setCustomers] = useState(customerSeed);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [selected, setSelected] = useState<Customer | null>(null);
  const createCustomer = () => { setEditing(null); setFormOpen(true); };
  const editCustomer = (customer: Customer) => { setSelected(null); setEditing(customer); setFormOpen(true); };
  const saveCustomer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const record: Customer = {
      id: editing?.id ?? `customer-${Date.now()}`, name: String(form.get("name") ?? ""), company: String(form.get("company") ?? ""), phone: String(form.get("phone") ?? ""), email: String(form.get("email") ?? ""), business: Number(form.get("business") ?? 0), outstanding: Number(form.get("outstanding") ?? 0), status: String(form.get("status") ?? "Active"), billingAddress: String(form.get("billingAddress") ?? ""), shippingAddress: String(form.get("shippingAddress") ?? ""), gstin: String(form.get("gstin") ?? ""), notes: String(form.get("notes") ?? ""),
    };
    setCustomers((current) => editing ? current.map((customer) => customer.id === editing.id ? record : customer) : [record, ...current]);
    setFormOpen(false);
    toast(editing ? "Customer updated." : "Customer added to this preview.");
  };
  const columns: DataColumn<Customer>[] = [
    { id: "name", label: "Customer name", render: (row) => <NameLink name={row.name} onClick={() => setSelected(row)} /> },
    { id: "company", label: "Company", render: (row) => row.company },
    { id: "phone", label: "Phone", render: (row) => <span className="text-muted-foreground">{row.phone}</span> },
    { id: "email", label: "Email", render: (row) => <span className="text-muted-foreground">{row.email}</span> },
    { id: "business", label: "Total business", render: (row) => <span className="font-medium">{currency(row.business)}</span> },
    { id: "outstanding", label: "Outstanding balance", render: (row) => <span className={row.outstanding > 0 ? "font-medium text-danger" : "text-muted-foreground"}>{currency(row.outstanding)}</span> },
    { id: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
    { id: "actions", label: "", className: "w-10 text-right", render: (row) => <RowActions onView={() => setSelected(row)} onEdit={() => editCustomer(row)} onDelete={() => { setCustomers((current) => current.filter((item) => item.id !== row.id)); toast("Customer removed from this preview."); }} /> },
  ];
  const outstanding = customers.reduce((sum, customer) => sum + customer.outstanding, 0);

  return (
    <AppShell>
      <PageHeader title="Customers" description="Manage relationships, account details, and outstanding balances." actions={<><ImportExportActions /><Button size="sm" className="h-8" onClick={createCustomer}><Plus />Add customer</Button></>} />
      <MetricGrid>
        <MetricCard icon={<UsersRound className="h-4 w-4" />} label="Total customers" value={String(customers.length + 418)} change="8.6%" />
        <MetricCard icon={<Check className="h-4 w-4" />} label="Active customers" value="392" change="6.2%" />
        <MetricCard icon={<Sparkles className="h-4 w-4" />} label="New customers" value="26" change="11.8%" />
        <MetricCard icon={<CreditCard className="h-4 w-4" />} label="Outstanding payments" value={currency(outstanding)} change="3.2%" positive={false} />
      </MetricGrid>
      <DataTable rows={customers} columns={columns} filterKey="status" filterOptions={["Active", "New", "Payment due", "Inactive"]} searchPlaceholder="Search customers by name, company, email…" />
      <Dialog open={formOpen} onOpenChange={setFormOpen}><CustomerForm editing={editing} onSave={saveCustomer} onCancel={() => setFormOpen(false)} /></Dialog>
      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        {selected && <CustomerDetail customer={selected} onEdit={() => editCustomer(selected)} />}
      </Dialog>
    </AppShell>
  );
}

const dealStages = ["New", "Qualified", "Proposal Sent", "Negotiation", "Closed Won", "Closed Lost"];

function DealForm({ editing, onSave, onCancel }: { editing: Deal | null; onSave: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void }) {
  return (
    <DialogContent key={editing?.id ?? "new-deal"} className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
      <DialogHeader><DialogTitle>{editing ? "Edit deal" : "Add deal"}</DialogTitle><DialogDescription>Set the value, stage, and expected close date.</DialogDescription></DialogHeader>
      <form onSubmit={onSave} className="space-y-4"><div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Deal name"><Input name="name" required defaultValue={editing?.name} placeholder="Project or opportunity" /></FormField>
        <FormField label="Customer"><Select name="customer" defaultValue={editing?.customer ?? customerSeed[0]?.company}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{customerSeed.map((customer) => <SelectItem key={customer.id} value={customer.company}>{customer.company}</SelectItem>)}</SelectContent></Select></FormField>
        <FormField label="Deal value (₹)"><Input name="value" type="number" min="0" defaultValue={editing?.value ?? 0} /></FormField>
        <FormField label="Stage"><Select name="stage" defaultValue={editing?.stage ?? "New"}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{dealStages.map((stage) => <SelectItem key={stage} value={stage}>{stage}</SelectItem>)}</SelectContent></Select></FormField>
        <FormField label="Expected closing date"><Input name="closingDate" type="date" defaultValue={editing?.closingDate ?? "2026-05-31"} /></FormField>
        <FormField label="Probability (%)"><Input name="probability" type="number" min="0" max="100" defaultValue={editing?.probability ?? 25} /></FormField>
      </div><DialogFooter><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit">{editing ? "Save changes" : "Add deal"}</Button></DialogFooter></form>
    </DialogContent>
  );
}

export function DealsPage() {
  const [deals, setDeals] = useState(dealSeed);
  const [view, setView] = useState<"list" | "kanban">("list");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Deal | null>(null);
  const [selected, setSelected] = useState<Deal | null>(null);
  const editDeal = (deal: Deal) => { setSelected(null); setEditing(deal); setFormOpen(true); };
  const saveDeal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const record: Deal = { id: editing?.id ?? `deal-${Date.now()}`, name: String(form.get("name") ?? ""), customer: String(form.get("customer") ?? ""), value: Number(form.get("value") ?? 0), stage: String(form.get("stage") ?? "New"), closingDate: String(form.get("closingDate") ?? ""), probability: Number(form.get("probability") ?? 0) };
    setDeals((current) => editing ? current.map((deal) => deal.id === editing.id ? record : deal) : [record, ...current]);
    setFormOpen(false);
    toast(editing ? "Deal updated." : "Deal added to this preview.");
  };
  const totalPipeline = deals.filter((deal) => !deal.stage.startsWith("Closed")).reduce((sum, deal) => sum + deal.value, 0);
  const columns: DataColumn<Deal>[] = [
    { id: "name", label: "Deal name", render: (row) => <NameLink name={row.name} onClick={() => setSelected(row)} /> },
    { id: "customer", label: "Customer", render: (row) => row.customer },
    { id: "value", label: "Deal value", render: (row) => <span className="font-medium">{currency(row.value)}</span> },
    { id: "stage", label: "Stage", render: (row) => <StatusBadge status={row.stage} /> },
    { id: "closing", label: "Expected close", render: (row) => <span className="text-muted-foreground">{row.closingDate}</span> },
    { id: "probability", label: "Probability", render: (row) => <span>{row.probability}%</span> },
    { id: "actions", label: "", className: "w-10 text-right", render: (row) => <RowActions onView={() => setSelected(row)} onEdit={() => editDeal(row)} onDelete={() => { setDeals((current) => current.filter((item) => item.id !== row.id)); toast("Deal removed from this preview."); }} /> },
  ];

  return (
    <AppShell>
      <PageHeader title="Deals & Pipeline" description="Track every opportunity from first conversation to close." actions={<Button size="sm" className="h-8" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus />Add deal</Button>} />
      <MetricGrid>
        <MetricCard icon={<BriefcaseBusiness className="h-4 w-4" />} label="Total deals" value={String(deals.length + 72)} change="10.5%" />
        <MetricCard icon={<Activity className="h-4 w-4" />} label="Open deals" value="34" change="8.4%" />
        <MetricCard icon={<Check className="h-4 w-4" />} label="Won deals" value="18" change="5.2%" />
        <MetricCard icon={<CircleDollarSign className="h-4 w-4" />} label="Pipeline value" value={currency(totalPipeline)} change="13.6%" />
      </MetricGrid>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{deals.length} opportunities in your pipeline</p>
        <div className="inline-flex items-center rounded-md border border-border bg-card p-0.5">
          <Button variant={view === "list" ? "secondary" : "ghost"} size="sm" className="h-7 px-2.5 text-xs" onClick={() => setView("list")}><List />List view</Button>
          <Button variant={view === "kanban" ? "secondary" : "ghost"} size="sm" className="h-7 px-2.5 text-xs" onClick={() => setView("kanban")}><LayoutGrid />Kanban</Button>
        </div>
      </div>
      {view === "list" ? <DataTable rows={deals} columns={columns} filterKey="stage" filterOptions={dealStages} searchPlaceholder="Search deals by name or customer…" /> : (
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {dealStages.map((stage) => {
            const stageDeals = deals.filter((deal) => deal.stage === stage);
            return <section key={stage} className="min-w-0 rounded-md border border-border bg-muted/50 p-2.5">
              <div className="mb-2 flex items-center justify-between gap-2 px-1"><h2 className="truncate text-xs font-semibold">{stage}</h2><span className="grid h-5 min-w-5 place-items-center rounded-sm bg-card px-1 text-[10px] text-muted-foreground">{stageDeals.length}</span></div>
              <div className="space-y-2">
                {stageDeals.map((deal) => <article key={deal.id} className="rounded-md border border-border bg-card p-3 shadow-sm">
                  <button type="button" className="w-full truncate text-left text-xs font-medium hover:underline" onClick={() => setSelected(deal)}>{deal.name}</button>
                  <p className="mt-1 truncate text-[10px] text-muted-foreground">{deal.customer}</p>
                  <div className="mt-3 flex items-center justify-between gap-2"><span className="text-xs font-semibold tabular-nums">{currency(deal.value)}</span><span className="text-[10px] text-muted-foreground">{deal.probability}%</span></div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${deal.probability}%` }} /></div>
                  <p className="mt-2 text-[10px] text-muted-foreground">Close {deal.closingDate}</p>
                </article>)}
                {stageDeals.length === 0 && <div className="rounded-md border border-dashed border-border px-2 py-6 text-center text-[10px] text-muted-foreground">No deals</div>}
              </div>
            </section>;
          })}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}><DealForm editing={editing} onSave={saveDeal} onCancel={() => setFormOpen(false)} /></Dialog>
      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        {selected && <DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{selected.name}</DialogTitle><DialogDescription>{selected.customer}</DialogDescription></DialogHeader><dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-md bg-muted/50 p-4"><DetailItem label="Deal value" value={currency(selected.value)} /><DetailItem label="Stage" value={<StatusBadge status={selected.stage} />} /><DetailItem label="Expected close" value={selected.closingDate} /><DetailItem label="Probability" value={`${selected.probability}%`} /></dl><DialogFooter><Button variant="outline" onClick={() => editDeal(selected)}>Edit deal</Button><Button onClick={() => toast("Deal activity is ready to update.")}>Add activity</Button></DialogFooter></DialogContent>}
      </Dialog>
    </AppShell>
  );
}

function InvoiceCreateForm({
  quantity,
  unitPrice,
  discount,
  gst,
  setQuantity,
  setUnitPrice,
  setDiscount,
  setGst,
  onSave,
  onCancel,
}: {
  quantity: string;
  unitPrice: string;
  discount: string;
  gst: string;
  setQuantity: (value: string) => void;
  setUnitPrice: (value: string) => void;
  setDiscount: (value: string) => void;
  setGst: (value: string) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  const subtotal = Math.max(0, Number(quantity) || 0) * Math.max(0, Number(unitPrice) || 0);
  const discountAmount = subtotal * (Math.max(0, Number(discount) || 0) / 100);
  const taxable = subtotal - discountAmount;
  const taxAmount = taxable * (Math.max(0, Number(gst) || 0) / 100);
  const total = taxable + taxAmount;
  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
      <DialogHeader><DialogTitle>Create invoice</DialogTitle><DialogDescription>Prepare an invoice preview using local sample data.</DialogDescription></DialogHeader>
      <form onSubmit={onSave} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Customer"><Select name="customer" defaultValue={customerSeed[0]?.company}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{customerSeed.map((customer) => <SelectItem key={customer.id} value={customer.company}>{customer.company}</SelectItem>)}</SelectContent></Select></FormField>
          <FormField label="Invoice number"><Input name="number" defaultValue="INV-2026-044" required /></FormField>
          <FormField label="Invoice date"><Input name="invoiceDate" type="date" defaultValue="2026-04-28" required /></FormField>
          <FormField label="Due date"><Input name="dueDate" type="date" defaultValue="2026-05-28" required /></FormField>
        </div>
        <FormField label="Billing details"><Textarea name="billingDetails" defaultValue="12, Maker Chambers, Mumbai, Maharashtra 400021" rows={2} /></FormField>
        <div className="rounded-md border border-border">
          <div className="grid grid-cols-[minmax(0,1fr)_72px_110px] gap-2 border-b border-border bg-muted/50 px-3 py-2 text-[10px] font-medium text-muted-foreground sm:grid-cols-[minmax(0,1fr)_90px_130px_110px_110px]"><span>Product or service</span><span>Qty</span><span>Unit price</span><span className="hidden sm:block">Discount %</span><span className="hidden sm:block">GST %</span></div>
          <div className="grid grid-cols-[minmax(0,1fr)_72px_110px] items-center gap-2 p-3 sm:grid-cols-[minmax(0,1fr)_90px_130px_110px_110px]">
            <Input name="item" defaultValue="Brand strategy and design" aria-label="Product or service" required />
            <Input name="quantity" type="number" min="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} aria-label="Quantity" />
            <Input name="unitPrice" type="number" min="0" value={unitPrice} onChange={(event) => setUnitPrice(event.target.value)} aria-label="Unit price" />
            <Input name="discount" className="hidden sm:flex" type="number" min="0" max="100" value={discount} onChange={(event) => setDiscount(event.target.value)} aria-label="Discount percent" />
            <Input name="gst" className="hidden sm:flex" type="number" min="0" max="100" value={gst} onChange={(event) => setGst(event.target.value)} aria-label="GST percent" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2"><FormField label="Payment terms"><Input name="terms" defaultValue="Due within 30 days" /></FormField><FormField label="Notes"><Input name="notes" placeholder="Add a note for your customer" /></FormField></div>
        <div className="ml-auto grid w-full max-w-xs gap-2 rounded-md bg-muted/50 p-3 text-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{currency(subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>−{currency(discountAmount)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">GST</span><span>{currency(taxAmount)}</span></div>
          <div className="flex justify-between border-t border-border pt-2 text-sm font-semibold"><span>Total</span><span>{currency(total)}</span></div>
        </div>
        <DialogFooter><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit">Save invoice</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}

export function InvoicesPage() {
  const [invoices, setInvoices] = useState(invoiceSeed);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [tab, setTab] = useState("All invoices");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("80000");
  const [discount, setDiscount] = useState("0");
  const [gst, setGst] = useState("18");
  const totalInvoiced = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const totalOutstanding = invoices.reduce((sum, invoice) => sum + invoice.balance, 0);
  const visibleInvoices = tab === "All invoices" ? invoices : invoices.filter((invoice) => invoice.status === tab);
  const makeInvoice = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const subtotal = Number(quantity) * Number(unitPrice);
    const total = (subtotal - subtotal * Number(discount) / 100) * (1 + Number(gst) / 100);
    const record: Invoice = {
      id: `invoice-${Date.now()}`, number: String(form.get("number") ?? "INV-2026-044"), customer: String(form.get("customer") ?? ""), invoiceDate: "28 Apr, 2026", dueDate: "28 May, 2026", total: Math.round(total), balance: Math.round(total), status: "Draft",
    };
    setInvoices((current) => [record, ...current]);
    setCreateOpen(false);
    setSelected(record);
    toast("Invoice saved to this preview.");
  };
  const recordPayment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    const amount = Math.max(0, Number(form.get("amount") ?? 0));
    const nextBalance = Math.max(0, selected.balance - amount);
    const nextInvoice = { ...selected, balance: nextBalance, status: nextBalance === 0 ? "Paid" : "Partially Paid" };
    setInvoices((current) => current.map((invoice) => invoice.id === selected.id ? nextInvoice : invoice));
    setSelected(nextInvoice);
    setPaymentOpen(false);
    toast("Payment recorded in this preview.");
  };
  const columns: DataColumn<Invoice>[] = [
    { id: "number", label: "Invoice number", render: (row) => <NameLink name={row.number} onClick={() => setSelected(row)} /> },
    { id: "customer", label: "Customer", render: (row) => row.customer },
    { id: "invoice-date", label: "Invoice date", render: (row) => <span className="text-muted-foreground">{row.invoiceDate}</span> },
    { id: "due-date", label: "Due date", render: (row) => <span className="text-muted-foreground">{row.dueDate}</span> },
    { id: "total", label: "Total amount", render: (row) => <span className="font-medium">{currency(row.total)}</span> },
    { id: "balance", label: "Balance due", render: (row) => <span className={row.balance > 0 ? "font-medium text-danger" : "text-muted-foreground"}>{currency(row.balance)}</span> },
    { id: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
    { id: "actions", label: "", className: "w-10 text-right", render: (row) => <RowActions onView={() => setSelected(row)} onEdit={() => toast("Invoice editing is available in this preview.")} onDelete={() => { setInvoices((current) => current.filter((invoice) => invoice.id !== row.id)); toast("Invoice removed from this preview."); }} /> },
  ];
  const tabs = ["All invoices", "Draft", "Unpaid", "Partially Paid", "Paid", "Overdue"];

  return (
    <AppShell>
      <PageHeader title="Invoices" description="Create, review, and keep track of customer billing." actions={<><ImportExportActions includeImport={false} /><Button size="sm" className="h-8" onClick={() => setCreateOpen(true)}><Plus />Create invoice</Button></>} />
      <MetricGrid>
        <MetricCard icon={<ReceiptText className="h-4 w-4" />} label="Total invoiced" value={currency(totalInvoiced)} change="12.4%" />
        <MetricCard icon={<Check className="h-4 w-4" />} label="Paid amount" value={currency(totalInvoiced - totalOutstanding)} change="8.8%" />
        <MetricCard icon={<CreditCard className="h-4 w-4" />} label="Outstanding amount" value={currency(totalOutstanding)} change="4.3%" positive={false} />
        <MetricCard icon={<CalendarClock className="h-4 w-4" />} label="Overdue amount" value={currency(invoices.filter((invoice) => invoice.status === "Overdue").reduce((sum, invoice) => sum + invoice.balance, 0))} change="1.6%" positive={false} />
      </MetricGrid>
      <Tabs value={tab} onValueChange={setTab}>
        <div className="mb-3 max-w-full overflow-x-auto">
          <TabsList className="h-9 min-w-max rounded-md bg-transparent p-0">
            {tabs.map((label) => <TabsTrigger key={label} value={label} className="h-9 rounded-none border-b-2 border-transparent px-3 text-xs data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">{label}</TabsTrigger>)}
          </TabsList>
        </div>
        <DataTable rows={visibleInvoices} columns={columns} filterKey="status" filterOptions={["Draft", "Unpaid", "Partially Paid", "Paid", "Overdue"]} searchPlaceholder="Search invoices by number or customer…" />
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <InvoiceCreateForm quantity={quantity} unitPrice={unitPrice} discount={discount} gst={gst} setQuantity={setQuantity} setUnitPrice={setUnitPrice} setDiscount={setDiscount} setGst={setGst} onSave={makeInvoice} onCancel={() => setCreateOpen(false)} />
      </Dialog>
      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        {selected && <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>Invoice {selected.number}</DialogTitle><DialogDescription>{selected.customer} · Issued {selected.invoiceDate}</DialogDescription></DialogHeader>
          <div className="space-y-5 rounded-md border border-border bg-card p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4"><div><p className="text-sm font-semibold">Yaglob Studio</p><p className="mt-1 text-[10px] text-muted-foreground">Mumbai, Maharashtra · billing@yaglob.co</p></div><StatusBadge status={selected.status} /></div>
            <div className="grid gap-4 sm:grid-cols-2"><div><p className="text-[10px] font-medium uppercase text-muted-foreground">Bill to</p><p className="mt-1 text-xs font-semibold">{selected.customer}</p><p className="mt-1 text-[10px] text-muted-foreground">Accounts payable<br />India</p></div><div className="sm:text-right"><p className="text-[10px] text-muted-foreground">Invoice date <span className="font-medium text-foreground">{selected.invoiceDate}</span></p><p className="mt-1 text-[10px] text-muted-foreground">Due date <span className="font-medium text-foreground">{selected.dueDate}</span></p></div></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[360px] text-xs"><thead className="border-y border-border bg-muted/50 text-left text-[10px] uppercase text-muted-foreground"><tr><th className="px-3 py-2 font-medium">Description</th><th className="px-3 py-2 text-right font-medium">Qty</th><th className="px-3 py-2 text-right font-medium">Rate</th><th className="px-3 py-2 text-right font-medium">Amount</th></tr></thead><tbody><tr className="border-b border-border"><td className="px-3 py-3">Creative services</td><td className="px-3 py-3 text-right">1</td><td className="px-3 py-3 text-right">{currency(selected.total)}</td><td className="px-3 py-3 text-right font-medium">{currency(selected.total)}</td></tr></tbody></table></div>
            <div className="ml-auto grid w-full max-w-xs gap-2 text-xs"><div className="flex justify-between"><span className="text-muted-foreground">Total</span><span>{currency(selected.total)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Balance due</span><span className="font-semibold">{currency(selected.balance)}</span></div></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => toast("PDF download is a frontend preview control.")}><FileText />Download PDF</Button>
            <Button variant="outline" size="sm" onClick={() => toast("Print preview is ready.")}><ReceiptText />Print</Button>
            <Button variant="outline" size="sm" onClick={() => toast("WhatsApp sharing is a frontend preview control.")}><MessageCircle />WhatsApp</Button>
            <Button variant="outline" size="sm" onClick={() => toast("Email sharing is a frontend preview control.")}><Mail />Email</Button>
            {selected.balance > 0 && <Button size="sm" onClick={() => setPaymentOpen(true)}><CreditCard />Record payment</Button>}
          </div>
        </DialogContent>}
      </Dialog>
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-sm"><DialogHeader><DialogTitle>Record payment</DialogTitle><DialogDescription>{selected?.number} · Balance {selected ? currency(selected.balance) : ""}</DialogDescription></DialogHeader>
          <form onSubmit={recordPayment} className="space-y-4"><FormField label="Amount received (₹)"><Input name="amount" type="number" min="1" max={selected?.balance} defaultValue={selected?.balance} required /></FormField><FormField label="Payment method"><Select name="method" defaultValue="Bank transfer"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Bank transfer", "UPI", "Cash", "Card"].map((method) => <SelectItem value={method} key={method}>{method}</SelectItem>)}</SelectContent></Select></FormField><DialogFooter><Button type="button" variant="outline" onClick={() => setPaymentOpen(false)}>Cancel</Button><Button type="submit">Save payment</Button></DialogFooter></form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}