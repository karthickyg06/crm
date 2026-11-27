import { buildInvoiceSeed } from "@/features/erp/historicalInvoiceSeed";

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
  owner: string;
  createdOn: string;
};

export type Customer = {
  id: string;
  name: string;
  company: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  business: number;
  outstanding: number;
  status: string;
  industry: string;
  deals: number;
  owner: string;
  createdOn: string;
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
  {
    id: "l1",
    name: "Aarav Mehta",
    company: "Northstar Studio",
    phone: "+91 98765 41028",
    email: "aarav@northstar.co",
    source: "Website",
    status: "Qualified",
    value: 185000,
    nextFollowUp: "28 Apr, 2026",
    notes: "Looking for a quarterly brand and web retainer.",
    owner: "Jane Mitchell",
    createdOn: "2 Dec 2026",
  },
  {
    id: "l2",
    name: "Mira Shah",
    company: "Fieldwork Labs",
    phone: "+91 98201 33561",
    email: "mira@fieldwork.io",
    source: "Referral",
    status: "Contacted",
    value: 92000,
    nextFollowUp: "29 Apr, 2026",
    notes: "Asked for a proposal after the first call.",
    owner: "Sam Rivera",
    createdOn: "1 Dec 2026",
  },
  {
    id: "l3",
    name: "Rohan Kapoor",
    company: "Cedar & Co.",
    phone: "+91 99870 14452",
    email: "rohan@cedar.co",
    source: "Google Ads",
    status: "New",
    value: 54000,
    nextFollowUp: "30 Apr, 2026",
    notes: "Interested in a product photography package.",
    owner: "Priya Nair",
    createdOn: "30 Nov 2026",
  },
  {
    id: "l4",
    name: "Ananya Rao",
    company: "Monsoon Goods",
    phone: "+91 98450 82193",
    email: "ananya@monsoon.goods",
    source: "Social Media",
    status: "Proposal",
    value: 246000,
    nextFollowUp: "02 May, 2026",
    notes: "Proposal shared; waiting on the operations lead.",
    owner: "Jane Mitchell",
    createdOn: "28 Nov 2026",
  },
  {
    id: "l5",
    name: "Kabir Desai",
    company: "Orbit Health",
    phone: "+91 98204 53180",
    email: "kabir@orbit.health",
    source: "Referral",
    status: "Qualified",
    value: 128000,
    nextFollowUp: "03 May, 2026",
    notes: "Three-location rollout planned for summer.",
    owner: "Sam Rivera",
    createdOn: "26 Nov 2026",
  },
  {
    id: "l6",
    name: "Ishita Nair",
    company: "Common Thread",
    phone: "+91 97412 26719",
    email: "ishita@commonthread.in",
    source: "Website",
    status: "Contacted",
    value: 76000,
    nextFollowUp: "04 May, 2026",
    notes: "Prefers a short discovery call in the afternoon.",
    owner: "Priya Nair",
    createdOn: "24 Nov 2026",
  },
  {
    id: "l7",
    name: "Dev Malhotra",
    company: "Brightside Works",
    phone: "+91 98111 29047",
    email: "dev@brightside.works",
    source: "Others",
    status: "New",
    value: 68000,
    nextFollowUp: "05 May, 2026",
    notes: "Met at the Design Forward conference.",
    owner: "Jane Mitchell",
    createdOn: "22 Nov 2026",
  },
  {
    id: "l8",
    name: "Tara Iyer",
    company: "Sunday Market",
    phone: "+91 98401 71052",
    email: "tara@sunday.market",
    source: "Google Ads",
    status: "Converted",
    value: 112000,
    nextFollowUp: "—",
    notes: "Converted to a customer on 21 April.",
    owner: "Sam Rivera",
    createdOn: "20 Nov 2026",
  },
];

export const customerSeed: Customer[] = [
  {
    id: "c1",
    name: "Meera Shah",
    company: "Fieldwork Labs",
    phone: "+91 98201 33561",
    whatsappNumber: "+91 98201 33561",
    email: "meera@fieldwork.io",
    business: 462000,
    outstanding: 92000,
    status: "Active",
    industry: "Services",
    deals: 4,
    owner: "Jane Mitchell",
    createdOn: "2 Dec 2026",
    billingAddress: "12, Maker Chambers, Mumbai, Maharashtra 400021",
    shippingAddress: "Unit 4, MIDC Andheri East, Mumbai 400093",
    gstin: "27AABCF1234K1Z5",
    notes: "Prefers invoices by email. Net 30 terms.",
  },
  {
    id: "c2",
    name: "Nikhil Batra",
    company: "Northstar Studio",
    phone: "+91 98765 41028",
    whatsappNumber: "+91 98765 41028",
    email: "finance@northstar.co",
    business: 318000,
    outstanding: 0,
    status: "Active",
    industry: "Retail",
    deals: 3,
    owner: "Sam Rivera",
    createdOn: "28 Nov 2026",
    billingAddress: "8, Residency Road, Bengaluru, Karnataka 560025",
    shippingAddress: "Same as billing address",
    gstin: "29AABCN7821R1Z2",
    notes: "Long-term creative partner since 2024.",
  },
  {
    id: "c3",
    name: "Ananya Rao",
    company: "Monsoon Goods",
    phone: "+91 98450 82193",
    whatsappNumber: "+91 98450 82193",
    email: "accounts@monsoon.goods",
    business: 274500,
    outstanding: 74600,
    status: "Active",
    industry: "Retail",
    deals: 5,
    owner: "Priya Nair",
    createdOn: "22 Nov 2026",
    billingAddress: "56, Linking Road, Bandra West, Mumbai 400050",
    shippingAddress: "Warehouse 2, Bhiwandi, Maharashtra 421302",
    gstin: "27AANCM2481H1Z9",
    notes: "Send a statement of account each month.",
  },
  {
    id: "c4",
    name: "Kabir Desai",
    company: "Orbit Health",
    phone: "+91 98204 53180",
    whatsappNumber: "+91 98204 53180",
    email: "billing@orbit.health",
    business: 192000,
    outstanding: 54000,
    status: "Active",
    industry: "Healthcare",
    deals: 2,
    owner: "Jane Mitchell",
    createdOn: "18 Nov 2026",
    billingAddress: "204, Koramangala, Bengaluru, Karnataka 560034",
    shippingAddress: "Same as billing address",
    gstin: "29AABCO1147P1Z6",
    notes: "Primary contact for all four clinics.",
  },
  {
    id: "c5",
    name: "Riya Sen",
    company: "Paper & Pine",
    phone: "+91 98300 44123",
    whatsappNumber: "+91 98300 44123",
    email: "accounts@paperandpine.in",
    business: 86000,
    outstanding: 58000,
    status: "Inactive",
    industry: "Manufacturing",
    deals: 1,
    owner: "Sam Rivera",
    createdOn: "12 Nov 2026",
    billingAddress: "14, Park Street, Kolkata, West Bengal 700016",
    shippingAddress: "14, Park Street, Kolkata, West Bengal 700016",
    gstin: "19AAPPS6502C1Z0",
    notes: "New account, onboarding in progress.",
  },
  {
    id: "c6",
    name: "Arjun Menon",
    company: "Sunday Market",
    phone: "+91 98401 71052",
    whatsappNumber: "+91 98401 71052",
    email: "finance@sunday.market",
    business: 154000,
    outstanding: 0,
    status: "Blocked",
    industry: "Retail",
    deals: 2,
    owner: "Priya Nair",
    createdOn: "4 Nov 2026",
    billingAddress: "21, Adyar, Chennai, Tamil Nadu 600020",
    shippingAddress: "Same as billing address",
    gstin: "33AAVCS7012B1Z2",
    notes: "Paid in full for December invoice.",
  },
  {
    id: "c7",
    name: "Priya Kapoor",
    company: "StyleHub Retail",
    phone: "+91 98100 22110",
    whatsappNumber: "+91 98100 22110",
    email: "accounts@stylehub.in",
    business: 85000,
    outstanding: 0,
    status: "Active",
    industry: "Retail",
    deals: 1,
    owner: "Jane Mitchell",
    createdOn: "1 Dec 2026",
    billingAddress: "44, Connaught Place, New Delhi, Delhi 110001",
    shippingAddress: "Same as billing address",
    gstin: "07AABCS9912L1Z3",
    notes: "Retail chain HQ.",
  },
  {
    id: "c8",
    name: "Vikram Joshi",
    company: "Nova Apparel",
    phone: "+91 98220 33445",
    whatsappNumber: "+91 98220 33445",
    email: "finance@novaapparel.co",
    business: 142000,
    outstanding: 142000,
    status: "Active",
    industry: "Retail",
    deals: 1,
    owner: "Sam Rivera",
    createdOn: "30 Nov 2026",
    billingAddress: "9, SG Highway, Ahmedabad, Gujarat 380015",
    shippingAddress: "Same as billing address",
    gstin: "24AABCN4410M1Z8",
    notes: "Awaiting first payment.",
  },
  {
    id: "c9",
    name: "Sneha Iyer",
    company: "BrightPath Soft",
    phone: "+91 98860 11223",
    whatsappNumber: "+91 98860 11223",
    email: "ap@brightpath.soft",
    business: 210000,
    outstanding: 210000,
    status: "Active",
    industry: "Services",
    deals: 1,
    owner: "Priya Nair",
    createdOn: "29 Nov 2026",
    billingAddress: "3, Hitech City, Hyderabad, Telangana 500081",
    shippingAddress: "Same as billing address",
    gstin: "36AABCB2201P1Z4",
    notes: "Enterprise SaaS account.",
  },
  {
    id: "c10",
    name: "Rahul Verma",
    company: "UrbanMart",
    phone: "+91 98711 55667",
    whatsappNumber: "+91 98711 55667",
    email: "billing@urbanmart.in",
    business: 64000,
    outstanding: 0,
    status: "Active",
    industry: "Retail",
    deals: 1,
    owner: "Jane Mitchell",
    createdOn: "28 Nov 2026",
    billingAddress: "18, MG Road, Pune, Maharashtra 411001",
    shippingAddress: "Same as billing address",
    gstin: "27AABCU8832Q1Z1",
    notes: "Paid.",
  },
  {
    id: "c11",
    name: "Neha Kulkarni",
    company: "Finora Bank",
    phone: "+91 99000 77889",
    whatsappNumber: "+91 99000 77889",
    email: "vendor@finora.bank",
    business: 186000,
    outstanding: 186000,
    status: "Active",
    industry: "Services",
    deals: 1,
    owner: "Sam Rivera",
    createdOn: "27 Nov 2026",
    billingAddress: "Finora Tower, BKC, Mumbai, Maharashtra 400051",
    shippingAddress: "Same as billing address",
    gstin: "27AABCF7788R1Z6",
    notes: "Bank vendor onboarding.",
  },
  {
    id: "c12",
    name: "Dev Malhotra",
    company: "Brightside Works",
    phone: "+91 98111 29047",
    whatsappNumber: "+91 98111 29047",
    email: "dev@brightside.works",
    business: 99000,
    outstanding: 99000,
    status: "Active",
    industry: "Services",
    deals: 1,
    owner: "Jane Mitchell",
    createdOn: "26 Nov 2026",
    billingAddress: "7, Cyber Hub, Gurugram, Haryana 122002",
    shippingAddress: "Same as billing address",
    gstin: "06AABCB5512S1Z9",
    notes: "Annual retainer pending.",
  },
  {
    id: "c13",
    name: "Ishita Nair",
    company: "Common Thread",
    phone: "+91 97412 26719",
    whatsappNumber: "+91 97412 26719",
    email: "ishita@commonthread.in",
    business: 112000,
    outstanding: 0,
    status: "Active",
    industry: "Services",
    deals: 1,
    owner: "Priya Nair",
    createdOn: "25 Nov 2026",
    billingAddress: "22, Indiranagar, Bengaluru, Karnataka 560038",
    shippingAddress: "Same as billing address",
    gstin: "29AABCC3399T1Z2",
    notes: "Paid.",
  },
  {
    id: "c14",
    name: "Rohan Kapoor",
    company: "Cedar & Co.",
    phone: "+91 99870 14452",
    whatsappNumber: "+91 99870 14452",
    email: "rohan@cedar.co",
    business: 47000,
    outstanding: 47000,
    status: "Active",
    industry: "Retail",
    deals: 1,
    owner: "Sam Rivera",
    createdOn: "24 Nov 2026",
    billingAddress: "5, Koregaon Park, Pune, Maharashtra 411001",
    shippingAddress: "Same as billing address",
    gstin: "27AABCC4477U1Z5",
    notes: "Overdue follow-up.",
  },
];

export const customerIndustries = [
  { name: "Healthcare", value: 32.1, color: "#5685DD" },
  { name: "Retail", value: 24.5, color: "#449EA8" },
  { name: "Manufacturing", value: 16.7, color: "#43A980" },
  { name: "Services", value: 14.9, color: "#9271D0" },
  { name: "Others", value: 11.8, color: "#DF9B60" },
];

export const customerGrowth = [
  { month: "Jan", customers: 820 },
  { month: "Feb", customers: 860 },
  { month: "Mar", customers: 910 },
  { month: "Apr", customers: 940 },
  { month: "May", customers: 990 },
  { month: "Jun", customers: 1040 },
  { month: "Jul", customers: 1090 },
  { month: "Aug", customers: 1140 },
  { month: "Sep", customers: 1190 },
  { month: "Oct", customers: 1240 },
  { month: "Nov", customers: 1290 },
  { month: "Dec", customers: 1340 },
];

export const customerStatuses = [
  { name: "Active", value: 83.6, color: "#43A980" },
  { name: "Inactive", value: 10.1, color: "#DF9B60" },
  { name: "Blocked", value: 6.3, color: "#94A3B8" },
];

export const customerMetricSparks = {
  total: [40, 44, 48, 52, 50, 56, 60, 64, 62, 68, 72, 78],
  active: [36, 38, 42, 44, 46, 50, 52, 56, 58, 60, 64, 68],
  newest: [8, 10, 9, 12, 11, 14, 13, 16, 15, 18, 17, 20],
  churned: [18, 16, 17, 15, 14, 13, 12, 11, 12, 10, 9, 8],
};

export const dealSeed: Deal[] = [
  {
    id: "d1",
    name: "Website Redesign",
    customer: "StyleHub Retail",
    value: 250000,
    stage: "New",
    closingDate: "2026-05-25",
    probability: 25,
  },
  {
    id: "d2",
    name: "Brand Identity Pack",
    customer: "Nova Apparel",
    value: 180000,
    stage: "New",
    closingDate: "2026-05-28",
    probability: 20,
  },
  {
    id: "d3",
    name: "CRM Onboarding",
    customer: "BrightPath Soft",
    value: 320000,
    stage: "New",
    closingDate: "2026-06-02",
    probability: 30,
  },
  {
    id: "d4",
    name: "SEO Growth Plan",
    customer: "UrbanMart",
    value: 145000,
    stage: "Contacted",
    closingDate: "2026-05-22",
    probability: 35,
  },
  {
    id: "d5",
    name: "Mobile App UI",
    customer: "Finora Bank",
    value: 410000,
    stage: "Contacted",
    closingDate: "2026-05-30",
    probability: 40,
  },
  {
    id: "d6",
    name: "Content Retainer",
    customer: "Fieldwork Labs",
    value: 92000,
    stage: "Contacted",
    closingDate: "2026-05-18",
    probability: 38,
  },
  {
    id: "d7",
    name: "Product Launch Campaign",
    customer: "Monsoon Goods",
    value: 246000,
    stage: "Qualified",
    closingDate: "2026-05-20",
    probability: 45,
  },
  {
    id: "d8",
    name: "Clinic Photography",
    customer: "Orbit Health",
    value: 128000,
    stage: "Qualified",
    closingDate: "2026-05-26",
    probability: 50,
  },
  {
    id: "d9",
    name: "Q2 Ads Package",
    customer: "Cedar & Co.",
    value: 165000,
    stage: "Qualified",
    closingDate: "2026-06-04",
    probability: 48,
  },
  {
    id: "d10",
    name: "Q2 Content Package",
    customer: "Northstar Studio",
    value: 185000,
    stage: "Proposal",
    closingDate: "2026-05-14",
    probability: 60,
  },
  {
    id: "d11",
    name: "Customer Stories",
    customer: "Common Thread",
    value: 76000,
    stage: "Proposal",
    closingDate: "2026-05-28",
    probability: 55,
  },
  {
    id: "d12",
    name: "Brand Refresh",
    customer: "Paper & Pine",
    value: 210000,
    stage: "Negotiation",
    closingDate: "2026-05-08",
    probability: 80,
  },
  {
    id: "d13",
    name: "Retail Site Redesign",
    customer: "Sunday Market",
    value: 112000,
    stage: "Negotiation",
    closingDate: "2026-05-12",
    probability: 75,
  },
  {
    id: "d14",
    name: "Annual Retainer",
    customer: "Brightside Works",
    value: 360000,
    stage: "Won",
    closingDate: "2026-04-18",
    probability: 100,
  },
  {
    id: "d15",
    name: "Spring Lookbook",
    customer: "Cedar & Co.",
    value: 54000,
    stage: "Lost",
    closingDate: "2026-04-12",
    probability: 0,
  },
];

export const dealFunnel = [
  { name: "New", value: 246, fill: "#5685DD" },
  { name: "Contacted", value: 168, fill: "#449EA8" },
  { name: "Qualified", value: 126, fill: "#9271D0" },
  { name: "Proposal", value: 98, fill: "#DF9B60" },
  { name: "Negotiation", value: 80, fill: "#94A3B8" },
  { name: "Won", value: 56, fill: "#43A980" },
];

export const dealStageBars = [
  { name: "New", value: 246, fill: "#5685DD" },
  { name: "Contacted", value: 168, fill: "#449EA8" },
  { name: "Qualified", value: 126, fill: "#9271D0" },
  { name: "Proposal", value: 98, fill: "#DF9B60" },
  { name: "Negotiation", value: 80, fill: "#94A3B8" },
  { name: "Won", value: 56, fill: "#43A980" },
];

export const dealValueTrend = [
  { month: "Jan", value: 42, count: 18, won: 28, open: 36 },
  { month: "Feb", value: 48, count: 21, won: 32, open: 40 },
  { month: "Mar", value: 45, count: 19, won: 30, open: 38 },
  { month: "Apr", value: 58, count: 24, won: 38, open: 44 },
  { month: "May", value: 62, count: 26, won: 42, open: 48 },
  { month: "Jun", value: 55, count: 23, won: 36, open: 46 },
  { month: "Jul", value: 68, count: 28, won: 48, open: 52 },
  { month: "Aug", value: 71, count: 30, won: 50, open: 54 },
  { month: "Sep", value: 64, count: 27, won: 44, open: 50 },
  { month: "Oct", value: 74, count: 32, won: 52, open: 58 },
  { month: "Nov", value: 70, count: 29, won: 48, open: 56 },
  { month: "Dec", value: 78.4, count: 34, won: 56, open: 62 },
];

export const dealWinRate = [
  { name: "Won", value: 56, percent: 22.8, color: "#43A980" },
  { name: "Open", value: 168, percent: 68.3, color: "#5685DD" },
  { name: "Lost", value: 22, percent: 8.9, color: "#94A3B8" },
];

export const dealGauges = [
  { name: "Win Rate", value: 22.8, color: "#43A980", track: "#E7F5EF" },
  { name: "Close Rate", value: 64, color: "#5685DD", track: "#E8EEF8" },
  { name: "Pipeline Health", value: 78, color: "#9271D0", track: "#F0EAF8" },
];

export const dealMetricSpark = [42, 48, 45, 52, 58, 55, 62, 68, 64, 72, 70, 78];

export const dealKpiRings = [
  {
    label: "Total Deals",
    value: "246",
    percent: 82,
    color: "#9271D0",
    track: "#F0EAF8",
  },
  {
    label: "Open Deals",
    value: "168",
    percent: 68,
    color: "#5685DD",
    track: "#E8EEF8",
  },
  {
    label: "Won Deals",
    value: "56",
    percent: 56,
    color: "#DF9B60",
    track: "#F8EEE4",
  },
  {
    label: "Win Rate",
    value: "22.8%",
    percent: 23,
    color: "#43A980",
    track: "#E7F5EF",
  },
];

export const dealBoardStages = [
  {
    name: "New",
    count: 36,
    amount: 1240000,
    tone: "bg-[#EEF4FF]",
    accent: "#5685DD",
  },
  {
    name: "Contacted",
    count: 42,
    amount: 1820000,
    tone: "bg-[#EEF8F8]",
    accent: "#449EA8",
  },
  {
    name: "Qualified",
    count: 28,
    amount: 1680000,
    tone: "bg-[#F5F0FF]",
    accent: "#9271D0",
  },
  {
    name: "Proposal",
    count: 18,
    amount: 1475000,
    tone: "bg-[#FFF5EC]",
    accent: "#DF9B60",
  },
  {
    name: "Negotiation",
    count: 12,
    amount: 1025000,
    tone: "bg-[#F4F7FB]",
    accent: "#94A3B8",
  },
  {
    name: "Won",
    count: 0,
    amount: 0,
    tone: "bg-[#EEFAF4]",
    accent: "#43A980",
  },
  {
    name: "Lost",
    count: 0,
    amount: 0,
    tone: "bg-[#F8FAFC]",
    accent: "#94A3B8",
  },
];

/** Historical demo invoices (generated relative to module load / reset time). */
export const invoiceSeed: Invoice[] = buildInvoiceSeed();

export const invoiceMetricSpark = [
  48, 52, 50, 58, 62, 60, 68, 72, 70, 76, 80, 86,
];

export const invoiceSummary = {
  total: 784000,
  paid: { amount: 520000, count: 12 },
  pending: { amount: 164000, count: 8 },
  overdue: { amount: 100000, count: 6 },
  totals: { all: 52, paid: 12, pending: 8, overdue: 6 },
};

export const revenueSeries = [
  { month: "Jan", revenue: 42, costs: 28, active: false },
  { month: "Feb", revenue: 58, costs: 34, active: false },
  { month: "Mar", revenue: 51, costs: 31, active: false },
  { month: "Apr", revenue: 74, costs: 40, active: false },
  { month: "May", revenue: 63, costs: 36, active: false },
  { month: "Jun", revenue: 88, costs: 48, active: false },
  { month: "Jul", revenue: 96, costs: 52, active: true },
  { month: "Aug", revenue: 71, costs: 41, active: false },
  { month: "Sep", revenue: 54, costs: 33, active: false },
  { month: "Oct", revenue: 67, costs: 38, active: false },
  { month: "Nov", revenue: 82, costs: 45, active: false },
  { month: "Dec", revenue: 78, costs: 44, active: false },
];

export const salesGrowth = [
  { name: "growth", value: 70.8 },
  { name: "remaining", value: 29.2 },
];

export const recentSales = [
  {
    id: "s1",
    orderId: "#3021",
    date: "22 Apr, 2026",
    customer: "Fieldwork Labs",
    category: "Retainer",
    status: "Completed",
    items: 3,
    total: 92000,
  },
  {
    id: "s2",
    orderId: "#3020",
    date: "21 Apr, 2026",
    customer: "Monsoon Goods",
    category: "Campaign",
    status: "Pending",
    items: 5,
    total: 246000,
  },
  {
    id: "s3",
    orderId: "#3019",
    date: "20 Apr, 2026",
    customer: "Northstar Studio",
    category: "Brand",
    status: "Completed",
    items: 2,
    total: 128000,
  },
  {
    id: "s4",
    orderId: "#3018",
    date: "18 Apr, 2026",
    customer: "Orbit Health",
    category: "Photography",
    status: "Pending",
    items: 4,
    total: 54000,
  },
  {
    id: "s5",
    orderId: "#3017",
    date: "16 Apr, 2026",
    customer: "Sunday Market",
    category: "Web",
    status: "Completed",
    items: 1,
    total: 86000,
  },
];

export const leadSources = [
  { name: "Website", value: 32.5, color: "#5685DD" },
  { name: "Google Ads", value: 24.1, color: "#449EA8" },
  { name: "Referral", value: 15.2, color: "#9271D0" },
  { name: "Social Media", value: 14.6, color: "#43A980" },
  { name: "Others", value: 13.6, color: "#DF9B60" },
];

export const leadFunnel = [
  { name: "New", value: 420, fill: "#8AA8E5" },
  { name: "Contacted", value: 276, fill: "#5685DD" },
  { name: "Qualified", value: 198, fill: "#449EA8" },
  { name: "Proposal", value: 168, fill: "#9271D0" },
  { name: "Converted", value: 286, fill: "#43A980" },
];

export const leadTrend = [
  { day: "1", leads: 24, label: "Dec 1" },
  { day: "5", leads: 38, label: "Dec 5" },
  { day: "9", leads: 31, label: "Dec 9" },
  { day: "13", leads: 52, label: "Dec 13" },
  { day: "17", leads: 44, label: "Dec 17" },
  { day: "21", leads: 63, label: "Dec 21" },
  { day: "25", leads: 48, label: "Dec 25" },
  { day: "29", leads: 71, label: "Dec 29" },
];

export const leadMetricSparks = {
  total: [38, 44, 42, 50, 56, 54, 60, 66, 62, 70, 76, 82],
  hot: [16, 20, 18, 24, 22, 28, 26, 32, 30, 34, 36, 40],
  converted: [10, 12, 14, 13, 16, 18, 20, 19, 22, 24, 26, 28],
  open: [58, 56, 60, 54, 50, 48, 46, 44, 42, 40, 38, 36],
};

export const pipelineStages = [
  { name: "New", value: 36, amount: 1240000 },
  { name: "Contacted", value: 42, amount: 1820000 },
  { name: "Qualified", value: 28, amount: 1680000 },
  { name: "Proposal", value: 18, amount: 1475000 },
  { name: "Negotiation", value: 12, amount: 1025000 },
];
