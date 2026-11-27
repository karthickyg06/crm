import type { Customer, Lead } from "@/features/crm/data";
import {
  loadCustomers,
  loadLeads,
  listProducts,
  listVendors,
  saveCustomers,
  saveLeads,
  saveProductWithStockLedger,
  upsertVendor,
} from "@/features/erp/demoStore";
import type { Product, Vendor } from "@/features/erp/types";

import type { ModuleImportConfig } from "./types";
import {
  normalizeEmail,
  normalizePhone,
  parseOptionalNumber,
} from "./validate";

function todayLabel() {
  return new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function cell(row: Record<string, string>, key: string) {
  return row[key] ?? "";
}

function leadDuplicateKey(record: Partial<Lead>) {
  const email = record.email ? normalizeEmail(record.email) : "";
  const phone = record.phone ? normalizePhone(record.phone) : "";
  if (email) return `email:${email}`;
  if (phone) return `phone:${phone}`;
  if (record.name && record.company && phone) {
    return `name-company-phone:${record.name.trim().toLowerCase()}|${record.company.trim().toLowerCase()}|${phone}`;
  }
  if (record.name && record.company) {
    return `name-company:${record.name.trim().toLowerCase()}|${record.company.trim().toLowerCase()}`;
  }
  return null;
}

export const leadsImportConfig: ModuleImportConfig<Lead> = {
  moduleId: "leads",
  label: "Leads",
  columns: [
    {
      key: "name",
      header: "Name",
      aliases: ["Lead name", "Full name", "Contact name"],
      required: true,
      example: "Aarav Mehta",
    },
    {
      key: "company",
      header: "Company",
      aliases: ["Organization", "Organisation"],
      required: true,
      example: "Northstar Studio",
    },
    {
      key: "phone",
      header: "Phone",
      aliases: ["Mobile", "Contact number"],
      type: "phone",
      preserveText: true,
      example: "+91 98765 41028",
    },
    {
      key: "email",
      header: "Email",
      aliases: ["Email address"],
      type: "email",
      example: "aarav@northstar.co",
    },
    {
      key: "source",
      header: "Source",
      aliases: ["Lead source"],
      enumValues: [
        "Website",
        "Google Ads",
        "Referral",
        "Social Media",
        "Others",
      ],
      type: "enum",
      example: "Website",
    },
    {
      key: "status",
      header: "Status",
      enumValues: ["New", "Contacted", "Qualified", "Proposal", "Converted"],
      type: "enum",
      example: "New",
    },
    {
      key: "value",
      header: "Value",
      aliases: ["Lead value", "Deal value", "Amount"],
      type: "number",
      example: "185000",
    },
    {
      key: "nextFollowUp",
      header: "Next Follow-up",
      aliases: ["Follow up", "Next follow up", "Follow-up"],
      type: "date",
      example: "28 Apr, 2026",
    },
    {
      key: "notes",
      header: "Notes",
      example: "Looking for a quarterly retainer.",
    },
    {
      key: "owner",
      header: "Owner",
      aliases: ["Assigned to"],
      example: "Jane Mitchell",
    },
  ],
  duplicateKey: leadDuplicateKey,
  existingKeys: () =>
    new Set(
      loadLeads()
        .map((lead) => leadDuplicateKey(lead))
        .filter((key): key is string => Boolean(key)),
    ),
  mapRow: (row, index) => ({
    id: `l-imp-${Date.now()}-${index}`,
    name: cell(row, "name"),
    company: cell(row, "company"),
    phone: cell(row, "phone"),
    email: cell(row, "email"),
    source: cell(row, "source") || "Website",
    status: cell(row, "status") || "New",
    value: parseOptionalNumber(cell(row, "value"), 0),
    nextFollowUp: cell(row, "nextFollowUp") || todayLabel(),
    notes: cell(row, "notes"),
    owner: cell(row, "owner") || "Unassigned",
    createdOn: todayLabel(),
  }),
  persist: (records) => {
    saveLeads([...records, ...loadLeads()]);
  },
  toExportRow: (lead) => ({
    Name: lead.name,
    Company: lead.company,
    Phone: lead.phone,
    Email: lead.email,
    Source: lead.source,
    Status: lead.status,
    Value: lead.value,
    "Next Follow-up": lead.nextFollowUp,
    Notes: lead.notes,
    Owner: lead.owner,
    "Created On": lead.createdOn,
  }),
  sampleRows: [
    {
      Name: "Aarav Mehta",
      Company: "Northstar Studio",
      Phone: "+91 98765 41028",
      Email: "aarav@northstar.co",
      Source: "Website",
      Status: "New",
      Value: "185000",
      "Next Follow-up": "28 Apr, 2026",
      Notes: "Looking for a quarterly retainer.",
      Owner: "Jane Mitchell",
    },
  ],
};

function customerDuplicateKey(record: Partial<Customer>) {
  const email = record.email ? normalizeEmail(record.email) : "";
  const phone = record.phone ? normalizePhone(record.phone) : "";
  // Never treat company name alone as unique.
  if (email) return `email:${email}`;
  if (phone && record.name) {
    return `name-phone:${record.name.trim().toLowerCase()}|${phone}`;
  }
  if (phone) return `phone:${phone}`;
  if (record.name && record.company && phone) {
    return `name-company-phone:${record.name.trim().toLowerCase()}|${record.company.trim().toLowerCase()}|${phone}`;
  }
  return null;
}

export const customersImportConfig: ModuleImportConfig<Customer> = {
  moduleId: "customers",
  label: "Customers",
  columns: [
    {
      key: "name",
      header: "Name",
      aliases: ["Customer name", "Contact name"],
      required: true,
      example: "Priya Nair",
    },
    {
      key: "company",
      header: "Company",
      aliases: ["Organization"],
      required: true,
      example: "Harbor & Co",
    },
    {
      key: "phone",
      header: "Phone",
      type: "phone",
      preserveText: true,
      example: "+91 98111 22334",
    },
    {
      key: "whatsappNumber",
      header: "WhatsApp",
      aliases: ["WhatsApp number", "Whatsapp"],
      type: "phone",
      preserveText: true,
      example: "+91 98111 22334",
    },
    {
      key: "email",
      header: "Email",
      type: "email",
      example: "priya@harbor.co",
    },
    {
      key: "industry",
      header: "Industry",
      example: "Retail",
    },
    {
      key: "status",
      header: "Status",
      enumValues: ["Active", "Inactive", "Blocked"],
      type: "enum",
      example: "Active",
    },
    {
      key: "gstin",
      header: "GSTIN",
      type: "gstin",
      example: "27AABCU9603R1ZM",
    },
    {
      key: "billingAddress",
      header: "Billing Address",
      aliases: ["Billing address", "Address"],
      example: "12 Marine Drive, Mumbai",
    },
    {
      key: "shippingAddress",
      header: "Shipping Address",
      aliases: ["Shipping address"],
      example: "12 Marine Drive, Mumbai",
    },
    {
      key: "notes",
      header: "Notes",
      example: "Prefers email follow-ups.",
    },
    {
      key: "owner",
      header: "Owner",
      example: "Jane Mitchell",
    },
  ],
  duplicateKey: customerDuplicateKey,
  existingKeys: () =>
    new Set(
      loadCustomers()
        .map((customer) => customerDuplicateKey(customer))
        .filter((key): key is string => Boolean(key)),
    ),
  mapRow: (row, index) => ({
    id: `c-imp-${Date.now()}-${index}`,
    name: cell(row, "name"),
    company: cell(row, "company"),
    phone: cell(row, "phone"),
    whatsappNumber: cell(row, "whatsappNumber") || cell(row, "phone") || "",
    email: cell(row, "email"),
    business: 0,
    outstanding: 0,
    status: cell(row, "status") || "Active",
    industry: cell(row, "industry") || "Services",
    deals: 0,
    owner: cell(row, "owner") || "Unassigned",
    createdOn: todayLabel(),
    billingAddress: cell(row, "billingAddress"),
    shippingAddress: cell(row, "shippingAddress"),
    gstin: cell(row, "gstin").toUpperCase(),
    notes: cell(row, "notes"),
  }),
  persist: (records) => {
    saveCustomers([...records, ...loadCustomers()]);
  },
  toExportRow: (customer) => ({
    Name: customer.name,
    Company: customer.company,
    Phone: customer.phone,
    WhatsApp: customer.whatsappNumber,
    Email: customer.email,
    Industry: customer.industry,
    Status: customer.status,
    GSTIN: customer.gstin,
    "Billing Address": customer.billingAddress,
    "Shipping Address": customer.shippingAddress,
    Notes: customer.notes,
    Owner: customer.owner,
    "Created On": customer.createdOn,
  }),
  sampleRows: [
    {
      Name: "Priya Nair",
      Company: "Harbor & Co",
      Phone: "+91 98111 22334",
      WhatsApp: "+91 98111 22334",
      Email: "priya@harbor.co",
      Industry: "Retail",
      Status: "Active",
      GSTIN: "27AABCU9603R1ZM",
      "Billing Address": "12 Marine Drive, Mumbai",
      "Shipping Address": "12 Marine Drive, Mumbai",
      Notes: "Prefers email follow-ups.",
      Owner: "Jane Mitchell",
    },
  ],
};

function productDuplicateKey(record: Partial<Product>) {
  const sku = record.sku?.trim();
  if (!sku) return null;
  return `sku:${sku.toLowerCase()}`;
}

export const productsImportConfig: ModuleImportConfig<Product> = {
  moduleId: "products",
  label: "Products",
  columns: [
    {
      key: "name",
      header: "Name",
      aliases: ["Product name", "Service name"],
      required: true,
      example: "Brand retainer",
    },
    {
      key: "sku",
      header: "SKU",
      aliases: ["Sku", "Product code", "Code"],
      required: true,
      preserveText: true,
      example: "SVC-001",
    },
    {
      key: "hsnSac",
      header: "HSN/SAC",
      aliases: ["HSN", "SAC", "Hsn Sac"],
      preserveText: true,
      example: "998314",
    },
    {
      key: "category",
      header: "Category",
      example: "Services",
    },
    {
      key: "sellingPrice",
      header: "Selling Price",
      aliases: ["Sell price", "Price", "Unit price"],
      type: "number",
      required: true,
      example: "25000",
    },
    {
      key: "purchasePrice",
      header: "Purchase Price",
      aliases: ["Buy price", "Cost"],
      type: "number",
      example: "0",
    },
    {
      key: "gstRate",
      header: "GST %",
      aliases: ["GST", "Tax %", "Gst rate"],
      type: "percent",
      example: "18",
    },
    {
      key: "unit",
      header: "Unit",
      example: "pcs",
    },
    {
      key: "stockQty",
      header: "Stock",
      aliases: ["Stock qty", "Quantity", "Qty"],
      type: "number",
      example: "10",
    },
    {
      key: "lowStockAt",
      header: "Low Stock At",
      aliases: ["Reorder level"],
      type: "number",
      example: "2",
    },
    {
      key: "kind",
      header: "Type",
      aliases: ["Kind"],
      enumValues: ["product", "service"],
      type: "enum",
      example: "service",
    },
  ],
  duplicateKey: productDuplicateKey,
  existingKeys: () =>
    new Set(
      listProducts()
        .map((product) => productDuplicateKey(product))
        .filter((key): key is string => Boolean(key)),
    ),
  mapRow: (row, index) => {
    const kind =
      (cell(row, "kind") || "product").toLowerCase() === "service"
        ? "service"
        : "product";
    return {
      id: `p-imp-${Date.now()}-${index}`,
      name: cell(row, "name"),
      sku: cell(row, "sku"),
      hsnSac: cell(row, "hsnSac"),
      category: cell(row, "category") || "General",
      sellingPrice: parseOptionalNumber(cell(row, "sellingPrice"), 0),
      purchasePrice: parseOptionalNumber(cell(row, "purchasePrice"), 0),
      gstRate: parseOptionalNumber(cell(row, "gstRate"), 18),
      unit: cell(row, "unit") || "pcs",
      stockQty:
        kind === "service"
          ? 999
          : parseOptionalNumber(cell(row, "stockQty"), 0),
      lowStockAt: parseOptionalNumber(cell(row, "lowStockAt"), 0),
      kind,
    };
  },
  persist: (records) => {
    records.forEach((product) => {
      // Treat imported catalog rows as new openings (duplicates are skipped earlier).
      saveProductWithStockLedger(product, 0);
    });
  },
  toExportRow: (product) => ({
    Name: product.name,
    SKU: product.sku,
    "HSN/SAC": product.hsnSac,
    Category: product.category,
    "Selling Price": product.sellingPrice,
    "Purchase Price": product.purchasePrice,
    "GST %": product.gstRate,
    Unit: product.unit,
    Stock: product.stockQty,
    "Low Stock At": product.lowStockAt,
    Type: product.kind,
  }),
  sampleRows: [
    {
      Name: "Brand retainer",
      SKU: "SVC-001",
      "HSN/SAC": "998314",
      Category: "Services",
      "Selling Price": "25000",
      "Purchase Price": "0",
      "GST %": "18",
      Unit: "pcs",
      Stock: "10",
      "Low Stock At": "2",
      Type: "service",
    },
  ],
};

function vendorDuplicateKey(record: Partial<Vendor>) {
  const email = record.email ? normalizeEmail(record.email) : "";
  const phone = record.phone ? normalizePhone(record.phone) : "";
  if (email) return `email:${email}`;
  if (phone && record.company) {
    return `company-phone:${record.company.trim().toLowerCase()}|${phone}`;
  }
  if (phone) return `phone:${phone}`;
  return null;
}

export const vendorsImportConfig: ModuleImportConfig<Vendor> = {
  moduleId: "vendors",
  label: "Vendors",
  columns: [
    {
      key: "company",
      header: "Company",
      aliases: ["Vendor", "Vendor name", "Organization"],
      required: true,
      example: "Paper Mills Pvt Ltd",
    },
    {
      key: "name",
      header: "Contact Name",
      aliases: ["Name", "Contact"],
      required: true,
      example: "Ravi Kumar",
    },
    {
      key: "phone",
      header: "Phone",
      type: "phone",
      preserveText: true,
      example: "+91 99887 76655",
    },
    {
      key: "email",
      header: "Email",
      type: "email",
      example: "ravi@papermills.in",
    },
    {
      key: "gstin",
      header: "GSTIN",
      type: "gstin",
      example: "29AABCT1332L1ZB",
    },
    {
      key: "address",
      header: "Address",
      example: "Peenya Industrial Area, Bengaluru",
    },
    {
      key: "status",
      header: "Status",
      enumValues: ["Active", "Inactive"],
      type: "enum",
      example: "Active",
    },
  ],
  duplicateKey: vendorDuplicateKey,
  existingKeys: () =>
    new Set(
      listVendors()
        .map((vendor) => vendorDuplicateKey(vendor))
        .filter((key): key is string => Boolean(key)),
    ),
  mapRow: (row, index) => ({
    id: `v-imp-${Date.now()}-${index}`,
    name: cell(row, "name"),
    company: cell(row, "company"),
    phone: cell(row, "phone"),
    email: cell(row, "email"),
    gstin: cell(row, "gstin").toUpperCase(),
    address: cell(row, "address"),
    status:
      (cell(row, "status") || "Active") === "Inactive" ? "Inactive" : "Active",
  }),
  persist: (records) => {
    records.forEach((vendor) => upsertVendor(vendor));
  },
  toExportRow: (vendor) => ({
    Company: vendor.company,
    "Contact Name": vendor.name,
    Phone: vendor.phone,
    Email: vendor.email,
    GSTIN: vendor.gstin,
    Address: vendor.address,
    Status: vendor.status,
  }),
  sampleRows: [
    {
      Company: "Paper Mills Pvt Ltd",
      "Contact Name": "Ravi Kumar",
      Phone: "+91 99887 76655",
      Email: "ravi@papermills.in",
      GSTIN: "29AABCT1332L1ZB",
      Address: "Peenya Industrial Area, Bengaluru",
      Status: "Active",
    },
  ],
};
