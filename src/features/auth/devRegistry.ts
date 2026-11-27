export type DevStatus =
  "implemented" | "in-progress" | "pending" | "blocked" | "upcoming";

export type TestingStatus =
  "not-started" | "unit-covered" | "manual-pending" | "verified";

export type DevTrack = "current" | "roadmap";

export type DevFeature = {
  id: string;
  name: string;
  description: string;
  phase: string;
  track: DevTrack;
  status: DevStatus;
  testingStatus: TestingStatus;
  priority: "P0" | "P1" | "P2" | "P3";
  notes: string;
  limitations: string;
  lastUpdated: string;
  nextAction: string;
  businessValue: string;
  dependencies: string;
};

export type DevRegistryState = {
  version: number;
  features: DevFeature[];
};

const DEV_KEY = "yaglob.dev.registry.v1";
export const DEV_REGISTRY_VERSION = 3;

export const ROADMAP_PHASES = [
  "Phase 1 — Production Foundation",
  "Phase 2 — Intelligent Business Automation",
  "Phase 3 — AI-Powered Billing",
  "Phase 4 — AI Business Intelligence",
  "Phase 5 — Autonomous Business Agents",
  "Phase 6 — Enterprise & Industry Expansion",
] as const;

export type RoadmapPhase = (typeof ROADMAP_PHASES)[number];

export const PRODUCT_DIFFERENTIATORS: Array<{
  id: string;
  title: string;
  businessValue: string;
}> = [
  {
    id: "nl-invoice",
    title: "Natural-language invoice creation",
    businessValue:
      "Lets teams create invoices by describing the sale in plain language, reducing data entry time and training burden for new staff.",
  },
  {
    id: "voice-billing",
    title: "Tamil and English voice billing",
    businessValue:
      "Enables faster counter and field billing for bilingual teams, improving throughput without changing established spoken workflows.",
  },
  {
    id: "doc-to-txn",
    title: "Intelligent document-to-transaction conversion",
    businessValue:
      "Turns purchase bills, quotes, and statements into draft transactions, cutting manual re-keying and transcription errors.",
  },
  {
    id: "predictive",
    title: "Predictive business recommendations",
    businessValue:
      "Surfaces forward-looking cash, inventory, and sales guidance so owners can act before problems appear in month-end reports.",
  },
  {
    id: "cross-module-agents",
    title: "Cross-module AI agents",
    businessValue:
      "Coordinates CRM, billing, inventory, and payments in one flow, reducing hand-offs between disconnected tools.",
  },
  {
    id: "auto-workflows",
    title: "Automated business workflows",
    businessValue:
      "Standardizes reminders, approvals, and follow-ups so routine operations continue even when staff are busy.",
  },
  {
    id: "role-ai",
    title: "Role-specific AI assistance",
    businessValue:
      "Gives each role relevant prompts and actions, improving productivity without exposing unrelated modules or controls.",
  },
  {
    id: "industry-adaptive",
    title: "Industry-adaptive business management",
    businessValue:
      "Adapts fields, workflows, and defaults to industry needs so the same platform serves retail, services, and distribution teams.",
  },
  {
    id: "human-controlled",
    title: "Human-controlled autonomous business operations",
    businessValue:
      "Keeps people in the approval loop for AI-generated actions, combining automation speed with accountable oversight.",
  },
];

type Listener = () => void;
const listeners = new Set<Listener>();

function canUseStorage() {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
  listeners.forEach((listener) => listener());
}

export function subscribeDevRegistry(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

type SeedInput = Omit<
  DevFeature,
  "lastUpdated" | "track" | "businessValue" | "dependencies"
> & {
  lastUpdated?: string;
  track?: DevTrack;
  businessValue?: string;
  dependencies?: string;
};

function seedFeatures(): DevFeature[] {
  const today = new Date().toISOString().slice(0, 10);
  const item = (partial: SeedInput): DevFeature => ({
    lastUpdated: today,
    track: "current",
    businessValue: "",
    dependencies: "",
    ...partial,
  });

  const current: DevFeature[] = [
    item({
      id: "dashboard",
      name: "Main Dashboard",
      description: "Live KPI cards and recent invoices from shared store.",
      phase: "Core",
      status: "implemented",
      testingStatus: "unit-covered",
      priority: "P0",
      notes: "Role-aware widget filtering added with auth sprint.",
      limitations: "Header Last 7/30 days control remains decorative.",
      nextAction: "Wire header date-range filter.",
    }),
    item({
      id: "revenue-insights",
      name: "Revenue Insights",
      description: "Grouped sales/collections bars with year filters.",
      phase: "Core",
      status: "implemented",
      testingStatus: "unit-covered",
      priority: "P0",
      notes: "Monthly/quarterly aggregation from invoice and payment ledgers.",
      limitations:
        "Existing v2 local data needs Reset Demo Data for historical spread.",
      nextAction: "Manual browser chart verification.",
    }),
    item({
      id: "leads",
      name: "Leads Management",
      description: "Lead CRUD, KPIs, convert to customer.",
      phase: "CRM",
      status: "implemented",
      testingStatus: "unit-covered",
      priority: "P0",
      notes: "Import/export supported.",
      limitations: "Follow-up date validation needs browser QA.",
      nextAction: "Manual follow-up validation.",
    }),
    item({
      id: "customers",
      name: "Customer Management",
      description: "Customer CRUD with outstanding recompute.",
      phase: "CRM",
      status: "implemented",
      testingStatus: "unit-covered",
      priority: "P0",
      notes: "Import/export and duplicate detection.",
      limitations: "Record-level ownership not implemented.",
      nextAction: "Keep module-level ACL only for demo.",
    }),
    item({
      id: "deals",
      name: "Deals & Pipeline",
      description: "Deal stages and pipeline board.",
      phase: "CRM",
      status: "implemented",
      testingStatus: "manual-pending",
      priority: "P1",
      notes: "Pipeline UI present.",
      limitations: "Activity tooling verification pending.",
      nextAction: "Browser verify deal activities.",
    }),
    item({
      id: "products",
      name: "Products & Services",
      description: "Shared catalog for quotes/invoices/stock.",
      phase: "Catalog",
      status: "implemented",
      testingStatus: "unit-covered",
      priority: "P0",
      notes: "CSV/XLSX import-export.",
      limitations: "Variants not supported.",
      nextAction: "None for this sprint.",
    }),
    item({
      id: "quotations",
      name: "Quotations",
      description: "Quote lines and convert-once to invoice.",
      phase: "Sales",
      status: "implemented",
      testingStatus: "unit-covered",
      priority: "P0",
      notes: "Conversion guarded against duplicates.",
      limitations: "Quotation-specific PDF fields incomplete vs invoices.",
      nextAction: "Quotation PDF field audit.",
    }),
    item({
      id: "invoices",
      name: "Invoice Management",
      description: "Multi-item invoices, issue, templates, PDF.",
      phase: "Finance",
      status: "implemented",
      testingStatus: "unit-covered",
      priority: "P0",
      notes: "A4/A5/thermal templates registered.",
      limitations: "Physical printer QA pending; premium redesign postponed.",
      nextAction: "Printer compatibility testing.",
    }),
    item({
      id: "payments",
      name: "Payment Recording",
      description: "Partial/full payments and receipts.",
      phase: "Finance",
      status: "implemented",
      testingStatus: "unit-covered",
      priority: "P0",
      notes: "Idempotent payment keys.",
      limitations: "No bank reconciliation.",
      nextAction: "None for this sprint.",
    }),
    item({
      id: "inventory",
      name: "Inventory & Purchasing",
      description: "Vendors, PO, GRN, stock movements.",
      phase: "Ops",
      status: "implemented",
      testingStatus: "unit-covered",
      priority: "P0",
      notes: "Stock deduction on invoice issue; receive goods safeguards.",
      limitations: "Multi-warehouse not available.",
      nextAction: "None for this sprint.",
    }),
    item({
      id: "import-export",
      name: "CSV/Excel Import & Export",
      description: "Master-data import with validation and export.",
      phase: "Platform",
      status: "implemented",
      testingStatus: "unit-covered",
      priority: "P0",
      notes: "SheetJS CE 0.20.3; duplicate detection.",
      limitations: "Large-file performance not load-tested.",
      nextAction: "Large-file import performance test.",
    }),
    item({
      id: "auth-rbac",
      name: "Demo Auth & RBAC",
      description: "Temporary login, users, roles, permissions.",
      phase: "Platform",
      status: "in-progress",
      testingStatus: "unit-covered",
      priority: "P0",
      notes: "Client-side PBKDF2 demo auth.",
      limitations: "Not production security; localStorage inspectable.",
      nextAction: "Migrate to Supabase Auth later.",
    }),
    item({
      id: "reports",
      name: "Reports",
      description: "CSV exports for sales, payments, stock, GST.",
      phase: "Finance",
      status: "pending",
      testingStatus: "manual-pending",
      priority: "P1",
      notes: "Functional CSV export exists; redesign postponed.",
      limitations: "Full-width tables, filters, pagination incomplete.",
      nextAction: "Report accuracy audit.",
    }),
    item({
      id: "whatsapp-email",
      name: "WhatsApp / Email delivery",
      description:
        "Document delivery connectors. Future Phase 2 automation builds on this capability rather than duplicating it.",
      phase: "Communication",
      status: "blocked",
      testingStatus: "not-started",
      priority: "P2",
      notes: "UI shows NotConfigured.",
      limitations: "Requires Meta/Resend credentials and server adapters.",
      nextAction: "Configure connectors when available.",
      businessValue:
        "Reliable outbound delivery is required before automatic invoice and reminder workflows can go live.",
      dependencies:
        "Meta WhatsApp Business API, email provider, server adapters.",
    }),
    item({
      id: "notifications-center",
      name: "Toast Notifications & Notification Center",
      description:
        "Premium Sonner toasts, durable activity feed, header bell, and Super Admin notification center.",
      phase: "Platform",
      status: "implemented",
      testingStatus: "unit-covered",
      priority: "P1",
      notes:
        "Demo localStorage ACL only. Org-wide center requires notifications:view. Delivery events record NotConfigured/Failed honestly — no fake Sent.",
      limitations:
        "Not production-secure; server-side enforcement required for multi-tenant privacy.",
      nextAction: "Manual browser QA for bell unread count and toast variants.",
      businessValue:
        "Gives administrators trustworthy operational visibility without fake delivery claims.",
      dependencies: "Auth RBAC, Sonner, existing module operations.",
    }),
    item({
      id: "card-design-system",
      name: "Premium 3D Card Design System",
      description:
        "Centralized heavy elevation tokens, equal KPI/summary heights, shared MetricCard/Panel/SummaryCard chrome across modules.",
      phase: "Polish",
      status: "implemented",
      testingStatus: "unit-covered",
      priority: "P1",
      notes:
        "Uses --shadow-card-premium with strong bottom depth. Charts/forms keep auto height; Reports receives shared chrome only.",
      limitations:
        "Login/AccessDenied remain branded surfaces outside the KPI system.",
      nextAction:
        "Responsive browser QA for large currency values and shadow spacing.",
      businessValue:
        "Consistent enterprise card elevation improves scanability without changing business metrics.",
      dependencies: "Existing MetricCard, Panel, styles.css design tokens.",
    }),
  ];

  const roadmap = seedRoadmapFeatures(item);
  return [...current, ...roadmap];
}

function seedRoadmapFeatures(
  item: (partial: SeedInput) => DevFeature,
): DevFeature[] {
  const upcoming = (partial: {
    id: string;
    name: string;
    description: string;
    phase: RoadmapPhase;
    priority?: DevFeature["priority"];
    businessValue: string;
    dependencies: string;
    notes?: string;
    limitations?: string;
    nextAction?: string;
  }): DevFeature =>
    item({
      id: partial.id,
      name: partial.name,
      description: partial.description,
      phase: partial.phase,
      status: "upcoming",
      testingStatus: "not-started",
      track: "roadmap",
      priority: partial.priority ?? "P2",
      notes: partial.notes ?? "Roadmap vision — not started in this sprint.",
      limitations: partial.limitations ?? "Not implemented.",
      nextAction:
        partial.nextAction ?? "Defer until prior phase foundations land.",
      businessValue: partial.businessValue,
      dependencies: partial.dependencies,
    });

  const p1 = ROADMAP_PHASES[0];
  const p2 = ROADMAP_PHASES[1];
  const p3 = ROADMAP_PHASES[2];
  const p4 = ROADMAP_PHASES[3];
  const p5 = ROADMAP_PHASES[4];
  const p6 = ROADMAP_PHASES[5];

  return [
    // Phase 1 — reuse supabase-auth + saas-billing IDs to avoid duplicates
    upcoming({
      id: "supabase-auth",
      name: "Supabase production database",
      description:
        "Move demo localStorage ledgers to a managed Postgres database.",
      phase: p1,
      priority: "P0",
      businessValue:
        "Provides durable multi-user storage and a path to production reliability.",
      dependencies: "Supabase project, schema migrations, data migration plan.",
    }),
    upcoming({
      id: "roadmap-secure-auth",
      name: "Secure authentication",
      description:
        "Production identity with session hardening and recovery flows.",
      phase: p1,
      priority: "P0",
      businessValue:
        "Protects customer and financial data with enterprise-grade sign-in controls.",
      dependencies: "Supabase Auth or equivalent IdP.",
    }),
    upcoming({
      id: "roadmap-server-rbac",
      name: "Server-side RBAC",
      description:
        "Enforce permissions on the server, not only in the browser.",
      phase: p1,
      priority: "P0",
      businessValue:
        "Prevents unauthorized reads and writes even if client UI is bypassed.",
      dependencies: "Secure authentication, policy engine, API layer.",
    }),
    upcoming({
      id: "roadmap-multi-tenant",
      name: "Multi-tenant SaaS architecture",
      description:
        "Organization-aware tenancy for many businesses on one platform.",
      phase: p1,
      priority: "P0",
      businessValue:
        "Enables commercial scale while keeping each customer’s workspace separate.",
      dependencies:
        "Supabase production database, org model, billing entitlements.",
    }),
    upcoming({
      id: "roadmap-org-isolation",
      name: "Organization-level data isolation",
      description:
        "Strict tenancy boundaries across CRM, finance, and inventory data.",
      phase: p1,
      priority: "P0",
      businessValue:
        "Builds customer trust by ensuring one organization cannot access another’s records.",
      dependencies: "Multi-tenant architecture, row-level security.",
    }),
    upcoming({
      id: "roadmap-audit-logs",
      name: "Audit logs",
      description:
        "Immutable trails for sensitive creates, edits, and deletions.",
      phase: p1,
      priority: "P1",
      businessValue:
        "Supports accountability, dispute resolution, and compliance reviews.",
      dependencies: "Server-side RBAC, durable storage.",
    }),
    upcoming({
      id: "roadmap-backups",
      name: "Automated backups",
      description: "Scheduled backups with tested restore procedures.",
      phase: p1,
      priority: "P1",
      businessValue:
        "Reduces downtime risk and protects against accidental or malicious data loss.",
      dependencies: "Supabase production database, ops runbooks.",
    }),
    upcoming({
      id: "roadmap-api-security",
      name: "API security",
      description:
        "Authenticated APIs with rate limits, CSRF, and input validation.",
      phase: p1,
      priority: "P0",
      businessValue:
        "Hardens integrations and mobile clients against abuse and data leaks.",
      dependencies: "Secure authentication, server-side RBAC.",
    }),
    upcoming({
      id: "saas-billing",
      name: "Subscription and usage management",
      description:
        "Plans, trials, seats, and usage limits for commercial SaaS.",
      phase: p1,
      priority: "P1",
      businessValue:
        "Turns the product into a billable platform with controlled feature access.",
      dependencies: "Multi-tenant architecture, payment provider.",
    }),

    // Phase 2 — skip WhatsApp/Email duplicates (tracked under whatsapp-email)
    upcoming({
      id: "roadmap-online-payments",
      name: "Online payments and UPI integration",
      description: "Collect invoice payments through UPI and online gateways.",
      phase: p2,
      priority: "P1",
      businessValue:
        "Shortens collection cycles and reduces manual payment confirmation work.",
      dependencies: "Payment gateway, secure webhooks, invoice ledger.",
    }),
    upcoming({
      id: "roadmap-payment-recon",
      name: "Automatic payment reconciliation",
      description:
        "Match gateway settlements to invoices and customer balances.",
      phase: p2,
      priority: "P1",
      businessValue:
        "Improves cash accuracy and frees finance teams from manual matching.",
      dependencies: "Online payments, payment ledger, bank/settlement feeds.",
    }),
    upcoming({
      id: "roadmap-recurring-invoices",
      name: "Recurring invoices",
      description: "Schedule repeat billing for retainers and subscriptions.",
      phase: p2,
      priority: "P2",
      businessValue:
        "Stabilizes recurring revenue and reduces missed billing cycles.",
      dependencies: "Invoice engine, scheduler, customer contracts.",
    }),
    upcoming({
      id: "roadmap-payment-reminders",
      name: "Payment reminders",
      description: "Automated due-date and overdue reminder sequences.",
      phase: p2,
      priority: "P2",
      businessValue:
        "Improves on-time collections without manual follow-up lists.",
      dependencies: "Delivery connectors, invoice aging rules.",
    }),
    upcoming({
      id: "roadmap-portals",
      name: "Customer and vendor portals",
      description:
        "Self-service views for invoices, payments, and purchase status.",
      phase: p2,
      priority: "P2",
      businessValue:
        "Reduces support load while giving partners transparent document access.",
      dependencies: "Secure authentication, organization isolation.",
    }),
    upcoming({
      id: "roadmap-gst-einvoice",
      name: "GST e-invoicing and e-way bill integration",
      description:
        "Connect compliance flows for Indian GST e-invoice and e-way bills.",
      phase: p2,
      priority: "P1",
      businessValue:
        "Helps businesses stay compliant and ship goods with less manual filing.",
      dependencies: "GST credentials, invoice snapshots, government APIs.",
    }),
    upcoming({
      id: "roadmap-approvals",
      name: "Digital approval workflows",
      description:
        "Configurable approvals for quotes, invoices, purchases, and credits.",
      phase: p2,
      priority: "P2",
      businessValue:
        "Adds control for high-value actions without slowing everyday operations.",
      dependencies: "Server-side RBAC, notification channels.",
    }),
    upcoming({
      id: "roadmap-business-notifications",
      name: "Automated business notifications",
      description:
        "Event-driven alerts for sales, stock, payments, and approvals.",
      phase: p2,
      priority: "P2",
      businessValue:
        "Keeps teams informed in near real time so exceptions are handled faster.",
      dependencies: "Event bus, delivery connectors.",
    }),

    // Phase 3
    upcoming({
      id: "roadmap-ai-invoice-agent",
      name: "AI Invoice Agent",
      description:
        "Assist users in drafting and validating invoices with AI guidance.",
      phase: p3,
      priority: "P2",
      businessValue:
        "Speeds billing while reducing incomplete or inconsistent invoice drafts.",
      dependencies: "AI gateway, invoice schema, human approval controls.",
    }),
    upcoming({
      id: "roadmap-voice-billing",
      name: "Tamil and English voice billing",
      description:
        "Create billing drafts from spoken Tamil or English commands.",
      phase: p3,
      priority: "P2",
      businessValue:
        "Supports bilingual field and counter teams with faster order capture.",
      dependencies: "Speech services, AI Invoice Agent, product catalog.",
    }),
    upcoming({
      id: "roadmap-ai-quotation",
      name: "AI quotation generation",
      description:
        "Draft quotations from customer context and catalog history.",
      phase: p3,
      priority: "P2",
      businessValue:
        "Helps sales respond faster with consistent pricing and line items.",
      dependencies: "Quotation module, catalog, pricing rules.",
    }),
    upcoming({
      id: "roadmap-doc-ocr",
      name: "AI document scanner and OCR",
      description:
        "Extract structured fields from photographed or scanned documents.",
      phase: p3,
      priority: "P2",
      businessValue:
        "Cuts re-keying from paper and PDF sources into the system of record.",
      dependencies: "OCR/vision models, secure file storage.",
    }),
    upcoming({
      id: "roadmap-smart-excel",
      name: "Intelligent Excel import and column mapping",
      description:
        "Suggest column mappings and clean imported spreadsheet data.",
      phase: p3,
      priority: "P2",
      businessValue:
        "Reduces import failures and onboarding time for messy customer files.",
      dependencies: "Existing import pipeline, AI mapping assist.",
    }),
    upcoming({
      id: "roadmap-purchase-extract",
      name: "AI purchase bill extraction",
      description: "Convert supplier bills into draft purchase records.",
      phase: p3,
      priority: "P2",
      businessValue:
        "Accelerates AP entry and improves purchase cost visibility.",
      dependencies: "Document OCR, purchasing modules.",
    }),
    upcoming({
      id: "roadmap-duplicate-invoice",
      name: "Duplicate invoice detection",
      description:
        "Flag likely duplicate customer or supplier invoices before posting.",
      phase: p3,
      priority: "P1",
      businessValue: "Prevents double billing and double payment mistakes.",
      dependencies: "Invoice and purchase ledgers, similarity rules.",
    }),
    upcoming({
      id: "roadmap-smart-products",
      name: "Smart product recommendations",
      description:
        "Suggest complementary or frequently sold products while billing.",
      phase: p3,
      priority: "P3",
      businessValue:
        "Increases average order value with contextual catalog suggestions.",
      dependencies: "Sales history, product catalog.",
    }),
    upcoming({
      id: "roadmap-ai-pricing",
      name: "AI-assisted pricing and discount recommendations",
      description:
        "Recommend discounts and price bands from margin and history.",
      phase: p3,
      priority: "P3",
      businessValue:
        "Protects margin while giving sales flexible, data-backed negotiation support.",
      dependencies: "Pricing history, margin rules, approval workflows.",
    }),

    // Phase 4 — reuse ai-assistant id
    upcoming({
      id: "ai-assistant",
      name: "AI Business Assistant",
      description:
        "Conversational assistant for day-to-day business questions.",
      phase: p4,
      priority: "P2",
      businessValue:
        "Gives owners quick answers without building custom reports for every question.",
      dependencies: "AI gateway, governed data access, audit logs.",
    }),
    upcoming({
      id: "roadmap-nl-reports",
      name: "Natural-language business reports",
      description: "Generate report answers from plain-language questions.",
      phase: p4,
      priority: "P2",
      businessValue:
        "Makes analytics accessible to non-technical managers and owners.",
      dependencies: "AI Business Assistant, trusted metrics layer.",
    }),
    upcoming({
      id: "roadmap-cashflow-predict",
      name: "Predictive cash flow analysis",
      description:
        "Project near-term cash position from invoices and payables.",
      phase: p4,
      priority: "P2",
      businessValue:
        "Helps owners anticipate shortfalls and plan collections earlier.",
      dependencies: "Payments, invoices, purchase obligations.",
    }),
    upcoming({
      id: "roadmap-revenue-forecast",
      name: "Revenue forecasting",
      description: "Forecast sales from pipeline, seasonality, and history.",
      phase: p4,
      priority: "P2",
      businessValue:
        "Supports planning for hiring, inventory, and growth targets.",
      dependencies: "CRM pipeline, invoice history.",
    }),
    upcoming({
      id: "roadmap-demand-forecast",
      name: "Inventory demand forecasting",
      description: "Predict stock needs from sales velocity and seasonality.",
      phase: p4,
      priority: "P2",
      businessValue:
        "Reduces stockouts and overstock while improving purchasing timing.",
      dependencies: "Inventory movements, sales history.",
    }),
    upcoming({
      id: "roadmap-retention",
      name: "Customer retention analysis",
      description: "Identify churn risk and reactivation opportunities.",
      phase: p4,
      priority: "P3",
      businessValue:
        "Protects recurring revenue by focusing teams on at-risk accounts.",
      dependencies: "Customer activity, invoice cadence.",
    }),
    upcoming({
      id: "roadmap-lead-scoring",
      name: "AI lead scoring",
      description:
        "Rank leads by likelihood to convert using behavioral signals.",
      phase: p4,
      priority: "P2",
      businessValue:
        "Helps sales prioritize high-potential opportunities first.",
      dependencies: "Leads module, historical conversion data.",
    }),
    upcoming({
      id: "roadmap-buying-patterns",
      name: "Customer buying-pattern analysis",
      description:
        "Reveal purchase frequency, basket patterns, and preferences.",
      phase: p4,
      priority: "P3",
      businessValue:
        "Improves upsell timing and personalized catalog engagement.",
      dependencies: "Invoice history, product catalog.",
    }),
    upcoming({
      id: "roadmap-health-score",
      name: "Business health score",
      description:
        "Composite score across cash, sales, stock, and collections.",
      phase: p4,
      priority: "P2",
      businessValue:
        "Gives a simple weekly pulse for owners without reading every report.",
      dependencies: "Finance and inventory metrics.",
    }),
    upcoming({
      id: "roadmap-anomaly-fraud",
      name: "AI anomaly and fraud detection",
      description:
        "Flag unusual invoices, discounts, refunds, and stock movements.",
      phase: p4,
      priority: "P1",
      businessValue:
        "Protects revenue and inventory integrity with early exception alerts.",
      dependencies: "Audit logs, transaction history.",
    }),
    upcoming({
      id: "roadmap-morning-brief",
      name: "Automated morning business briefing",
      description: "Daily digest of sales, dues, stock risks, and follow-ups.",
      phase: p4,
      priority: "P3",
      businessValue:
        "Starts the day with actionable priorities instead of manual report pulls.",
      dependencies: "Notification channels, analytics layer.",
    }),

    // Phase 5
    upcoming({
      id: "roadmap-ai-sales-agent",
      name: "AI Sales Agent",
      description:
        "Assist lead follow-up, quote drafting, and pipeline hygiene.",
      phase: p5,
      priority: "P2",
      businessValue:
        "Increases sales capacity by automating repetitive CRM follow-through.",
      dependencies: "CRM modules, AI gateway, approval controls.",
    }),
    upcoming({
      id: "roadmap-ai-invoice-workflows",
      name: "AI Invoice Agent with multi-step workflows",
      description:
        "Orchestrate draft, review, issue, and delivery steps with AI help.",
      phase: p5,
      priority: "P2",
      businessValue:
        "Shortens invoice cycle time while keeping review checkpoints intact.",
      dependencies: "AI Invoice Agent, approvals, delivery connectors.",
    }),
    upcoming({
      id: "roadmap-ai-collections",
      name: "AI Payment Collection Agent",
      description: "Prioritize dues and draft polite collection follow-ups.",
      phase: p5,
      priority: "P2",
      businessValue:
        "Improves recovery of overdue balances with consistent outreach.",
      dependencies: "Aging reports, reminders, human approval.",
    }),
    upcoming({
      id: "roadmap-ai-inventory-agent",
      name: "AI Inventory Agent",
      description: "Recommend replenishment and highlight stock exceptions.",
      phase: p5,
      priority: "P3",
      businessValue:
        "Keeps inventory healthier with fewer manual stock reviews.",
      dependencies: "Inventory module, demand forecasting.",
    }),
    upcoming({
      id: "roadmap-ai-purchase-agent",
      name: "AI Purchase Agent",
      description: "Draft purchase suggestions from demand and vendor history.",
      phase: p5,
      priority: "P3",
      businessValue:
        "Helps buyers act earlier on shortages with vendor-aware recommendations.",
      dependencies: "Purchasing, vendors, inventory forecasts.",
    }),
    upcoming({
      id: "roadmap-ai-financial-analyst",
      name: "AI Financial Analyst",
      description:
        "Explain variance, margins, and cash movements in plain language.",
      phase: p5,
      priority: "P2",
      businessValue:
        "Turns finance data into decisions without waiting for analyst bandwidth.",
      dependencies: "Finance ledgers, AI Business Assistant.",
    }),
    upcoming({
      id: "roadmap-ai-support-agent",
      name: "AI Customer Support Agent",
      description:
        "Answer order, invoice, and delivery questions with grounded data.",
      phase: p5,
      priority: "P3",
      businessValue:
        "Reduces repetitive support load while keeping answers tied to live records.",
      dependencies: "Customer portal data, governed retrieval.",
    }),
    upcoming({
      id: "roadmap-role-ai-employee",
      name: "Role-based AI Employee Assistant",
      description:
        "Provide role-scoped copilots for sales, finance, and operations.",
      phase: p5,
      priority: "P2",
      businessValue:
        "Improves individual productivity with assistance matched to permissions.",
      dependencies: "Server-side RBAC, AI gateway.",
    }),
    upcoming({
      id: "roadmap-supplier-compare",
      name: "Supplier quotation comparison assistant",
      description:
        "Compare vendor quotes on price, terms, and delivery signals.",
      phase: p5,
      priority: "P3",
      businessValue:
        "Helps purchasing choose better supplier offers with less spreadsheet work.",
      dependencies: "Vendor quotes, purchasing module.",
    }),
    upcoming({
      id: "roadmap-cross-module-automation",
      name: "Cross-module intelligent automation",
      description:
        "Trigger coordinated actions across CRM, billing, and inventory.",
      phase: p5,
      priority: "P2",
      businessValue:
        "Removes brittle manual hand-offs between related business processes.",
      dependencies: "Event model, approvals, module APIs.",
    }),
    upcoming({
      id: "roadmap-nl-workflow-builder",
      name: "Natural-language workflow builder",
      description:
        "Describe automation rules in plain language and review before save.",
      phase: p5,
      priority: "P3",
      businessValue:
        "Lets operations teams create automations without engineering tickets.",
      dependencies: "Workflow engine, human approval system.",
    }),
    upcoming({
      id: "roadmap-human-approval-ai",
      name: "Human approval system for AI-generated actions",
      description:
        "Require human confirmation before AI posts or sends actions.",
      phase: p5,
      priority: "P0",
      businessValue:
        "Keeps autonomy useful while preserving accountability and control.",
      dependencies: "Approval workflows, audit logs.",
    }),

    // Phase 6 — reuse pos id
    upcoming({
      id: "pos",
      name: "POS billing",
      description: "Retail point-of-sale billing with fast item entry.",
      phase: p6,
      priority: "P2",
      businessValue:
        "Supports counter sales with the same catalog and stock truth as back office.",
      dependencies: "Catalog, inventory, payments.",
    }),
    upcoming({
      id: "roadmap-barcode-qr",
      name: "Barcode and QR code scanning",
      description:
        "Scan products and documents for faster billing and receiving.",
      phase: p6,
      priority: "P2",
      businessValue:
        "Reduces typing errors and accelerates warehouse and retail operations.",
      dependencies: "POS/inventory clients, scanner hardware support.",
    }),
    upcoming({
      id: "roadmap-offline-billing",
      name: "Offline billing and synchronization",
      description:
        "Continue billing without connectivity and sync when online.",
      phase: p6,
      priority: "P2",
      businessValue:
        "Protects sales continuity in low-connectivity shops and field visits.",
      dependencies: "Local sync engine, conflict resolution.",
    }),
    upcoming({
      id: "roadmap-multi-branch",
      name: "Multi-branch management",
      description: "Manage branches with shared controls and local operations.",
      phase: p6,
      priority: "P1",
      businessValue:
        "Lets growing businesses run multiple locations from one platform.",
      dependencies: "Multi-tenant architecture, inventory isolation.",
    }),
    upcoming({
      id: "roadmap-warehouse",
      name: "Warehouse management",
      description:
        "Locations, bins, transfers, and warehouse-level stock truth.",
      phase: p6,
      priority: "P2",
      businessValue:
        "Improves fulfillment accuracy for businesses with multiple storage sites.",
      dependencies: "Inventory foundation, multi-branch.",
    }),
    upcoming({
      id: "roadmap-expenses-accounting",
      name: "Expenses and accounting",
      description: "Track expenses and deepen accounting integrations.",
      phase: p6,
      priority: "P2",
      businessValue:
        "Gives owners a fuller profit picture beyond sales and stock alone.",
      dependencies: "Finance ledgers, chart of accounts design.",
    }),
    upcoming({
      id: "roadmap-employee-tasks",
      name: "Employee task management",
      description: "Assign and track operational tasks across teams.",
      phase: p6,
      priority: "P3",
      businessValue:
        "Improves execution follow-through for sales, collections, and warehouse work.",
      dependencies: "Users/roles, notifications.",
    }),
    upcoming({
      id: "roadmap-custom-modules",
      name: "Custom module builder",
      description: "Compose additional business modules without core forks.",
      phase: p6,
      priority: "P3",
      businessValue:
        "Extends the platform for unique processes without long custom projects.",
      dependencies: "Platform metadata layer, RBAC.",
    }),
    upcoming({
      id: "roadmap-custom-fields",
      name: "Custom fields and workflows",
      description: "Add business-specific fields and process rules safely.",
      phase: p6,
      priority: "P2",
      businessValue:
        "Fits diverse industry processes while preserving upgradeability.",
      dependencies: "Custom module builder foundations.",
    }),
    upcoming({
      id: "roadmap-mobile-app",
      name: "Mobile application",
      description: "Native or hybrid mobile app for field sales and approvals.",
      phase: p6,
      priority: "P2",
      businessValue:
        "Keeps owners and field teams productive away from the desktop.",
      dependencies: "Secure APIs, offline strategy.",
    }),
    upcoming({
      id: "roadmap-integration-marketplace",
      name: "Third-party integration marketplace",
      description:
        "Catalog of connectors for accounting, logistics, and marketing tools.",
      phase: p6,
      priority: "P3",
      businessValue:
        "Lets customers extend Yaglob with tools they already rely on.",
      dependencies: "API security, partner program.",
    }),
    upcoming({
      id: "roadmap-industry-packs",
      name: "Industry-specific CRM and ERP configurations",
      description:
        "Starter packs for retail, services, distribution, and more.",
      phase: p6,
      priority: "P2",
      businessValue:
        "Shortens onboarding by shipping sensible defaults per industry.",
      dependencies: "Custom fields, workflow templates.",
    }),
    upcoming({
      id: "roadmap-multilingual",
      name: "Multilingual support",
      description: "Localize product UI and documents beyond English.",
      phase: p6,
      priority: "P2",
      businessValue:
        "Makes the platform usable for broader regional teams and customers.",
      dependencies: "i18n framework, document templates.",
    }),
  ];
}

function normalizeFeature(
  raw: Partial<DevFeature> & Pick<DevFeature, "id">,
): DevFeature {
  const today = new Date().toISOString().slice(0, 10);
  const legacyUpcomingIds = new Set([
    "supabase-auth",
    "saas-billing",
    "ai-assistant",
    "pos",
  ]);
  const track: DevTrack =
    raw.track === "roadmap" || raw.track === "current"
      ? raw.track
      : legacyUpcomingIds.has(raw.id) ||
          (typeof raw.phase === "string" && raw.phase.startsWith("Phase ")) ||
          (typeof raw.phase === "string" && raw.phase.startsWith("Stage "))
        ? "roadmap"
        : "current";

  return {
    id: raw.id,
    name: raw.name ?? raw.id,
    description: raw.description ?? "",
    phase: raw.phase ?? "Core",
    track,
    status: raw.status ?? "pending",
    testingStatus: raw.testingStatus ?? "not-started",
    priority: raw.priority ?? "P2",
    notes: raw.notes ?? "",
    limitations: raw.limitations ?? "",
    lastUpdated: raw.lastUpdated ?? today,
    nextAction: raw.nextAction ?? "",
    businessValue: raw.businessValue ?? "",
    dependencies: raw.dependencies ?? "",
  };
}

/** Preserve administrator-edited fields while merging newly seeded features. */
function mergeFeatures(
  existing: Array<Partial<DevFeature> & Pick<DevFeature, "id">>,
  seed: DevFeature[],
): DevFeature[] {
  const existingById = new Map(
    existing.map((feature) => [feature.id, normalizeFeature(feature)]),
  );
  const merged = seed.map((seedFeature) => {
    const prior = existingById.get(seedFeature.id);
    if (!prior) return seedFeature;
    existingById.delete(seedFeature.id);
    return {
      ...seedFeature,
      // Preserve admin-edited operational fields
      status: prior.status,
      testingStatus: prior.testingStatus,
      priority: prior.priority,
      notes: prior.notes,
      limitations: prior.limitations,
      nextAction: prior.nextAction,
      lastUpdated: prior.lastUpdated,
      businessValue: prior.businessValue || seedFeature.businessValue,
      dependencies: prior.dependencies || seedFeature.dependencies,
    };
  });

  // Keep unknown custom records so we never delete administrator data.
  for (const leftover of existingById.values()) {
    merged.push(leftover);
  }
  return merged;
}

export function loadDevRegistry(): DevRegistryState {
  const stored = readJson<DevRegistryState | null>(DEV_KEY, null);
  const seed = seedFeatures();

  if (
    !stored ||
    !Array.isArray(stored.features) ||
    stored.features.length === 0
  ) {
    const initial = { version: DEV_REGISTRY_VERSION, features: seed };
    writeJson(DEV_KEY, initial);
    return initial;
  }

  const needsMerge =
    stored.version !== DEV_REGISTRY_VERSION ||
    seed.some(
      (feature) => !stored.features.some((row) => row.id === feature.id),
    );

  if (!needsMerge) {
    return {
      version: DEV_REGISTRY_VERSION,
      features: stored.features.map((feature) => normalizeFeature(feature)),
    };
  }

  const merged = {
    version: DEV_REGISTRY_VERSION,
    features: mergeFeatures(stored.features, seed),
  };
  writeJson(DEV_KEY, merged);
  return merged;
}

export function saveDevRegistry(state: DevRegistryState) {
  writeJson(DEV_KEY, { ...state, version: DEV_REGISTRY_VERSION });
  return state;
}

export function listDevFeatures() {
  return loadDevRegistry().features;
}

export function listCurrentFeatures(features = listDevFeatures()) {
  return features.filter((feature) => feature.track === "current");
}

export function listRoadmapFeatures(features = listDevFeatures()) {
  return features.filter((feature) => feature.track === "roadmap");
}

export function updateDevFeature(
  id: string,
  patch: Partial<
    Pick<
      DevFeature,
      | "status"
      | "testingStatus"
      | "notes"
      | "limitations"
      | "nextAction"
      | "priority"
      | "businessValue"
      | "dependencies"
      | "description"
    >
  >,
) {
  const state = loadDevRegistry();
  const features = state.features.map((feature) =>
    feature.id === id
      ? {
          ...feature,
          ...patch,
          lastUpdated: new Date().toISOString().slice(0, 10),
        }
      : feature,
  );
  return saveDevRegistry({ ...state, features });
}

/**
 * Implementation progress uses the current track only so adding roadmap
 * vision items does not dilute the live product percentage.
 */
export function computeDevProgress(features = listDevFeatures()) {
  const current = listCurrentFeatures(features);
  const total = current.length;
  const implemented = current.filter((f) => f.status === "implemented").length;
  const inProgress = current.filter((f) => f.status === "in-progress").length;
  const pending = current.filter((f) => f.status === "pending").length;
  const blocked = current.filter((f) => f.status === "blocked").length;
  const upcoming = current.filter((f) => f.status === "upcoming").length;
  const percentage =
    total === 0 ? 0 : Math.round((implemented / total) * 1000) / 10;
  return {
    total,
    implemented,
    inProgress,
    pending,
    blocked,
    upcoming,
    percentage,
  };
}

export function computeRoadmapProgress(features = listDevFeatures()) {
  const roadmap = listRoadmapFeatures(features);
  const byPhase = ROADMAP_PHASES.map((phase) => {
    const items = roadmap.filter((feature) => feature.phase === phase);
    return {
      phase,
      total: items.length,
      upcoming: items.filter((f) => f.status === "upcoming").length,
      inProgress: items.filter((f) => f.status === "in-progress").length,
      implemented: items.filter((f) => f.status === "implemented").length,
      blocked: items.filter((f) => f.status === "blocked").length,
      pending: items.filter((f) => f.status === "pending").length,
    };
  });
  return {
    total: roadmap.length,
    upcoming: roadmap.filter((f) => f.status === "upcoming").length,
    byPhase,
  };
}
