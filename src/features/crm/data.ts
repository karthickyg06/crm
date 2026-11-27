export type Lead = {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  source: string;
  status: string;
  value: number;
  nextFollowUp: string;
  notes: string;
};

export type Customer = {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  business: number;
  outstanding: number;
  status: string;
  billingAddress: string;
  shippingAddress: string;
  gstin: string;
  notes: string;
};

export type Deal = {
  id: string;
  name: string;
  customer: string;
  value: number;
  stage: string;
  closingDate: string;
  probability: number;
};

export type Invoice = {
  id: string;
  number: string;
  customer: string;
  invoiceDate: string;
  dueDate: string;
  total: number;
  balance: number;
  status: string;
};

export const leadSeed: Lead[] = [
  { id: "l1", name: "Aarav Mehta", company: "Northstar Studio", phone: "+91 98765 41028", email: "aarav@northstar.co", source: "Website", status: "Qualified", value: 185000, nextFollowUp: "28 Apr, 2026", notes: "Looking for a quarterly brand and web retainer." },
  { id: "l2", name: "Mira Shah", company: "Fieldwork Labs", phone: "+91 98201 33561", email: "mira@fieldwork.io", source: "Referral", status: "Contacted", value: 92000, nextFollowUp: "29 Apr, 2026", notes: "Asked for a proposal after the first call." },
  { id: "l3", name: "Rohan Kapoor", company: "Cedar & Co.", phone: "+91 99870 14452", email: "rohan@cedar.co", source: "LinkedIn", status: "New", value: 54000, nextFollowUp: "30 Apr, 2026", notes: "Interested in a product photography package." },
  { id: "l4", name: "Ananya Rao", company: "Monsoon Goods", phone: "+91 98450 82193", email: "ananya@monsoon.goods", source: "Instagram", status: "Proposal sent", value: 246000, nextFollowUp: "02 May, 2026", notes: "Proposal shared; waiting on the operations lead." },
  { id: "l5", name: "Kabir Desai", company: "Orbit Health", phone: "+91 98204 53180", email: "kabir@orbit.health", source: "Referral", status: "Qualified", value: 128000, nextFollowUp: "03 May, 2026", notes: "Three-location rollout planned for summer." },
  { id: "l6", name: "Ishita Nair", company: "Common Thread", phone: "+91 97412 26719", email: "ishita@commonthread.in", source: "Website", status: "Contacted", value: 76000, nextFollowUp: "04 May, 2026", notes: "Prefers a short discovery call in the afternoon." },
  { id: "l7", name: "Dev Malhotra", company: "Brightside Works", phone: "+91 98111 29047", email: "dev@brightside.works", source: "Event", status: "New", value: 68000, nextFollowUp: "05 May, 2026", notes: "Met at the Design Forward conference." },
  { id: "l8", name: "Tara Iyer", company: "Sunday Market", phone: "+91 98401 71052", email: "tara@sunday.market", source: "LinkedIn", status: "Converted", value: 112000, nextFollowUp: "—", notes: "Converted to a customer on 21 April." },
];

export const customerSeed: Customer[] = [
  { id: "c1", name: "Meera Shah", company: "Fieldwork Labs", phone: "+91 98201 33561", email: "meera@fieldwork.io", business: 462000, outstanding: 38000, status: "Active", billingAddress: "12, Maker Chambers, Mumbai, Maharashtra 400021", shippingAddress: "Unit 4, MIDC Andheri East, Mumbai 400093", gstin: "27AABCF1234K1Z5", notes: "Prefers invoices by email. Net 30 terms." },
  { id: "c2", name: "Nikhil Batra", company: "Northstar Studio", phone: "+91 98765 41028", email: "finance@northstar.co", business: 318000, outstanding: 0, status: "Active", billingAddress: "8, Residency Road, Bengaluru, Karnataka 560025", shippingAddress: "Same as billing address", gstin: "29AABCN7821R1Z2", notes: "Long-term creative partner since 2024." },
  { id: "c3", name: "Ananya Rao", company: "Monsoon Goods", phone: "+91 98450 82193", email: "accounts@monsoon.goods", business: 274500, outstanding: 74600, status: "Active", billingAddress: "56, Linking Road, Bandra West, Mumbai 400050", shippingAddress: "Warehouse 2, Bhiwandi, Maharashtra 421302", gstin: "27AANCM2481H1Z9", notes: "Send a statement of account each month." },
  { id: "c4", name: "Kabir Desai", company: "Orbit Health", phone: "+91 98204 53180", email: "billing@orbit.health", business: 192000, outstanding: 22000, status: "Active", billingAddress: "204, Koramangala, Bengaluru, Karnataka 560034", shippingAddress: "Same as billing address", gstin: "29AABCO1147P1Z6", notes: "Primary contact for all four clinics." },
  { id: "c5", name: "Riya Sen", company: "Paper & Pine", phone: "+91 98300 44123", email: "accounts@paperandpine.in", business: 86000, outstanding: 0, status: "New", billingAddress: "14, Park Street, Kolkata, West Bengal 700016", shippingAddress: "14, Park Street, Kolkata, West Bengal 700016", gstin: "19AAPPS6502C1Z0", notes: "New account, onboarding in progress." },
  { id: "c6", name: "Arjun Menon", company: "Sunday Market", phone: "+91 98401 71052", email: "finance@sunday.market", business: 154000, outstanding: 154000, status: "Payment due", billingAddress: "21, Adyar, Chennai, Tamil Nadu 600020", shippingAddress: "Same as billing address", gstin: "33AAVCS7012B1Z2", notes: "Following up on April invoice." },
];

export const dealSeed: Deal[] = [
  { id: "d1", name: "Brand refresh", customer: "Northstar Studio", value: 185000, stage: "Negotiation", closingDate: "2026-05-08", probability: 80 },
  { id: "d2", name: "Q2 content package", customer: "Fieldwork Labs", value: 92000, stage: "Proposal Sent", closingDate: "2026-05-14", probability: 60 },
  { id: "d3", name: "Product launch campaign", customer: "Monsoon Goods", value: 246000, stage: "Qualified", closingDate: "2026-05-20", probability: 45 },
  { id: "d4", name: "Clinic photography", customer: "Orbit Health", value: 128000, stage: "New", closingDate: "2026-05-25", probability: 25 },
  { id: "d5", name: "Retail site redesign", customer: "Sunday Market", value: 112000, stage: "Closed Won", closingDate: "2026-04-18", probability: 100 },
  { id: "d6", name: "Spring lookbook", customer: "Cedar & Co.", value: 54000, stage: "Closed Lost", closingDate: "2026-04-12", probability: 0 },
  { id: "d7", name: "Customer stories", customer: "Common Thread", value: 76000, stage: "Proposal Sent", closingDate: "2026-05-28", probability: 55 },
];

export const invoiceSeed: Invoice[] = [
  { id: "i1", number: "INV-2026-042", customer: "Fieldwork Labs", invoiceDate: "22 Apr, 2026", dueDate: "22 May, 2026", total: 92000, balance: 38000, status: "Partially Paid" },
  { id: "i2", number: "INV-2026-041", customer: "Northstar Studio", invoiceDate: "18 Apr, 2026", dueDate: "18 May, 2026", total: 128000, balance: 0, status: "Paid" },
  { id: "i3", number: "INV-2026-040", customer: "Monsoon Goods", invoiceDate: "12 Apr, 2026", dueDate: "26 Apr, 2026", total: 74600, balance: 74600, status: "Overdue" },
  { id: "i4", number: "INV-2026-039", customer: "Orbit Health", invoiceDate: "08 Apr, 2026", dueDate: "08 May, 2026", total: 54000, balance: 22000, status: "Unpaid" },
  { id: "i5", number: "INV-2026-038", customer: "Sunday Market", invoiceDate: "02 Apr, 2026", dueDate: "02 May, 2026", total: 86000, balance: 0, status: "Paid" },
  { id: "i6", number: "INV-2026-043", customer: "Paper & Pine", invoiceDate: "26 Apr, 2026", dueDate: "26 May, 2026", total: 64000, balance: 64000, status: "Draft" },
  { id: "i7", number: "INV-2026-037", customer: "Brightside Works", invoiceDate: "25 Mar, 2026", dueDate: "08 Apr, 2026", total: 48000, balance: 48000, status: "Overdue" },
];

export const revenueSeries = [
  { month: "Nov", revenue: 58, costs: 35 },
  { month: "Dec", revenue: 72, costs: 42 },
  { month: "Jan", revenue: 65, costs: 38 },
  { month: "Feb", revenue: 88, costs: 50 },
  { month: "Mar", revenue: 76, costs: 45 },
  { month: "Apr", revenue: 104, costs: 59 },
];

export const leadSources = [
  { name: "Website", value: 38 },
  { name: "Referral", value: 26 },
  { name: "LinkedIn", value: 18 },
  { name: "Instagram", value: 11 },
  { name: "Other", value: 7 },
];

export const pipelineStages = [
  { name: "New", value: 12, amount: 184000 },
  { name: "Qualified", value: 19, amount: 320000 },
  { name: "Proposal sent", value: 14, amount: 268000 },
  { name: "Negotiation", value: 8, amount: 174000 },
  { name: "Closed won", value: 11, amount: 246000 },
];