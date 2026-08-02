export interface KpiMetric {
  label: string;
  value: string;
  change: number;
  target?: string;
  sparkline: number[];
  unavailable?: boolean;
}

export interface DailyPoint {
  date: string;
  sessions: number;
  leads: number;
  conversions: number;
}

export interface LeadEvent {
  event: string;
  revenueStreams: { cfs: boolean; membership: boolean; ticketing: boolean; merchandise: boolean };
  leads: number;
  target: number;
  variance: number;
  conversionRate: number;
}

export interface FunnelStep {
  label: string;
  value: number;
  abandonments?: number;
}

// GA4 data: 29 Jun – 28 Jul 2026 vs 30 May – 28 Jun 2026
// Source: BigQuery mcfc_analytics (backfilled from GA4 property 396933874)

export const behaviourKpis: KpiMetric[] = [
  {
    label: "Total Web Sessions",
    value: "114,321",
    change: 31.6,
    sparkline: [4505, 4300, 5521, 5042, 3059, 4199, 3308, 3596, 3565, 3663, 3072, 2699, 2755, 3004, 3502, 3522, 3742, 4730, 3558, 3113, 4919, 5412, 3129, 3608, 2742, 2770, 2961, 4097, 4400, 5221],
  },
  {
    label: "First Visits",
    value: "86,559",
    change: 25.0,
    sparkline: [3291, 3278, 4396, 4142, 2308, 3546, 2584, 2819, 2773, 2853, 2338, 2034, 2231, 2552, 2656, 2738, 2523, 3191, 2446, 2353, 3674, 3999, 2053, 2329, 1771, 1874, 2053, 2808, 3395, 4244],
  },
  {
    label: "Repeat Visits",
    value: "20,947",
    change: 59.2,
    sparkline: [951, 738, 894, 674, 623, 521, 562, 642, 612, 638, 527, 472, 374, 342, 662, 617, 920, 1286, 840, 537, 943, 1038, 808, 867, 755, 624, 644, 934, 780, 738],
  },
  {
    label: "Total Conversions",
    value: "549",
    change: 210.2,
    sparkline: [19, 17, 14, 15, 18, 15, 8, 7, 9, 19, 17, 14, 13, 21, 22, 12, 26, 21, 34, 21, 46, 31, 18, 16, 19, 11, 10, 18, 24, 14],
  },
  {
    label: "Revenue",
    value: "$62,440",
    change: 168.6,
    sparkline: [2223, 3955, 3131, 1575, 1350, 1500, 694, 755, 363, 2411, 495, 375, 1445, 396, 1414, 299, 4086, 3485, 5247, 659, 4627, 1309, 3023, 182, 5363, 1328, 1575, 4445, 4292, 439],
  },
  {
    label: "ROAS",
    value: "—",
    change: 0,
    sparkline: [],
    unavailable: true,
  },
];

export const leadsKpis: KpiMetric[] = [
  {
    label: "Total Email Subscriptions",
    value: "—",
    change: 0,
    sparkline: [],
    unavailable: true,
  },
  {
    label: "Total Leads",
    value: "6,543",
    change: 90.9,
    sparkline: [399, 305, 302, 296, 282, 233, 231, 177, 180, 290, 221, 158, 176, 212, 194, 114, 255, 231, 302, 167, 391, 228, 184, 133, 177, 137, 125, 184, 134, 125],
  },
  {
    label: "Cost Per Lead (CPL)",
    value: "—",
    change: 0,
    sparkline: [],
    unavailable: true,
  },
];

export const dailyTrend: DailyPoint[] = [
  { date: "29 Jun", sessions: 4505, leads: 399, conversions: 19 },
  { date: "30 Jun", sessions: 4300, leads: 305, conversions: 17 },
  { date: "1 Jul", sessions: 5521, leads: 302, conversions: 14 },
  { date: "2 Jul", sessions: 5042, leads: 296, conversions: 15 },
  { date: "3 Jul", sessions: 3059, leads: 282, conversions: 18 },
  { date: "4 Jul", sessions: 4199, leads: 233, conversions: 15 },
  { date: "5 Jul", sessions: 3308, leads: 231, conversions: 8 },
  { date: "6 Jul", sessions: 3596, leads: 177, conversions: 7 },
  { date: "7 Jul", sessions: 3565, leads: 180, conversions: 9 },
  { date: "8 Jul", sessions: 3663, leads: 290, conversions: 19 },
  { date: "9 Jul", sessions: 3072, leads: 221, conversions: 17 },
  { date: "10 Jul", sessions: 2699, leads: 158, conversions: 14 },
  { date: "11 Jul", sessions: 2755, leads: 176, conversions: 13 },
  { date: "12 Jul", sessions: 3004, leads: 212, conversions: 21 },
  { date: "13 Jul", sessions: 3502, leads: 194, conversions: 22 },
  { date: "14 Jul", sessions: 3522, leads: 114, conversions: 12 },
  { date: "15 Jul", sessions: 3742, leads: 255, conversions: 26 },
  { date: "16 Jul", sessions: 4730, leads: 231, conversions: 21 },
  { date: "17 Jul", sessions: 3558, leads: 302, conversions: 34 },
  { date: "18 Jul", sessions: 3113, leads: 167, conversions: 21 },
  { date: "19 Jul", sessions: 4919, leads: 391, conversions: 46 },
  { date: "20 Jul", sessions: 5412, leads: 228, conversions: 31 },
  { date: "21 Jul", sessions: 3129, leads: 184, conversions: 18 },
  { date: "22 Jul", sessions: 3608, leads: 133, conversions: 16 },
  { date: "23 Jul", sessions: 2742, leads: 177, conversions: 19 },
  { date: "24 Jul", sessions: 2770, leads: 137, conversions: 11 },
  { date: "25 Jul", sessions: 2961, leads: 125, conversions: 10 },
  { date: "26 Jul", sessions: 4097, leads: 184, conversions: 18 },
  { date: "27 Jul", sessions: 4400, leads: 134, conversions: 24 },
  { date: "28 Jul", sessions: 5221, leads: 125, conversions: 14 },
];

export const leadsByChannel = [
  { channel: "Direct", leads: 41716, color: "#F472B6" },
  { channel: "Google", leads: 36945, color: "#3DD9A4" },
  { channel: "Meta", leads: 27220, color: "#4F9CF7" },
  { channel: "Organic", leads: 9746, color: "#A78BFA" },
  { channel: "Other", leads: 5199, color: "#94A3B8" },
  { channel: "Email", leads: 118, color: "#FF8C42" },
];

export const leadsEvents: LeadEvent[] = [
  {
    event: "Add to Cart (Merch)",
    revenueStreams: { cfs: false, membership: false, ticketing: false, merchandise: true },
    leads: 2837,
    target: 0,
    variance: 0,
    conversionRate: 2.35,
  },
  {
    event: "Portal Click (CFS)",
    revenueStreams: { cfs: true, membership: false, ticketing: false, merchandise: false },
    leads: 1516,
    target: 0,
    variance: 0,
    conversionRate: 1.25,
  },
  {
    event: "Begin Checkout (Merch)",
    revenueStreams: { cfs: false, membership: false, ticketing: false, merchandise: true },
    leads: 769,
    target: 0,
    variance: 0,
    conversionRate: 0.64,
  },
  {
    event: "Registration (CFS)",
    revenueStreams: { cfs: true, membership: false, ticketing: false, merchandise: false },
    leads: 490,
    target: 0,
    variance: 0,
    conversionRate: 0.41,
  },
  {
    event: "Add to Cart (CFS)",
    revenueStreams: { cfs: true, membership: false, ticketing: false, merchandise: false },
    leads: 401,
    target: 0,
    variance: 0,
    conversionRate: 0.33,
  },
  {
    event: "Checkout Started (CFS)",
    revenueStreams: { cfs: true, membership: false, ticketing: false, merchandise: false },
    leads: 234,
    target: 0,
    variance: 0,
    conversionRate: 0.19,
  },
  {
    event: "Add Payment Info (Merch)",
    revenueStreams: { cfs: false, membership: false, ticketing: false, merchandise: true },
    leads: 224,
    target: 0,
    variance: 0,
    conversionRate: 0.19,
  },
  {
    event: "Contact (Phone/Email)",
    revenueStreams: { cfs: true, membership: true, ticketing: true, merchandise: true },
    leads: 71,
    target: 0,
    variance: 0,
    conversionRate: 0.06,
  },
  {
    event: "Ticketek Click-through",
    revenueStreams: { cfs: false, membership: false, ticketing: true, merchandise: false },
    leads: 1,
    target: 0,
    variance: 0,
    conversionRate: 0.00,
  },
];

export const funnelData: FunnelStep[] = [
  { label: "Total Sessions", value: 114321, abandonments: 107778 },
  { label: "Leads", value: 6543, abandonments: 5994 },
  { label: "Conversions", value: 549 },
];

export const comparisonOptions = [
  { label: "Previous period", value: "pop" },
  { label: "Same period last year", value: "yoy" },
] as const;
