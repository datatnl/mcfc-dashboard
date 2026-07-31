export interface KpiMetric {
  label: string;
  value: string;
  change: number;
  target?: string;
  sparkline: number[];
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

export const behaviourKpis: KpiMetric[] = [
  {
    label: "Total Web Sessions",
    value: "128,431",
    change: 4.2,
    sparkline: [85, 92, 88, 95, 102, 98, 110, 105, 115, 108, 120, 125, 118, 128],
  },
  {
    label: "First Visits",
    value: "84,102",
    change: 6.1,
    sparkline: [55, 60, 58, 62, 68, 65, 72, 70, 75, 73, 78, 82, 80, 84],
  },
  {
    label: "Repeat Visits",
    value: "44,329",
    change: -2.8,
    sparkline: [48, 46, 47, 45, 44, 46, 43, 45, 42, 44, 43, 45, 44, 44],
  },
  {
    label: "Total Conversions",
    value: "2,410",
    change: -3.1,
    target: "FY27 Target 3,000",
    sparkline: [180, 195, 185, 200, 210, 205, 195, 215, 200, 190, 210, 205, 215, 210],
  },
  {
    label: "Revenue",
    value: "$412,380",
    change: -10.2,
    target: "FY27 Target $500,000",
    sparkline: [28, 32, 30, 35, 38, 34, 36, 40, 37, 33, 38, 42, 39, 41],
  },
  {
    label: "ROAS",
    value: "4.1x",
    change: -1.2,
    sparkline: [3.8, 4.0, 3.9, 4.2, 4.5, 4.3, 4.1, 4.4, 4.2, 3.9, 4.1, 4.3, 4.0, 4.1],
  },
];

export const leadsKpis: KpiMetric[] = [
  {
    label: "Total Email Subscriptions",
    value: "8,420",
    change: 5.0,
    sparkline: [520, 560, 540, 580, 600, 590, 620, 610, 640, 630, 650, 660, 645, 670],
  },
  {
    label: "Total Leads",
    value: "9,640",
    change: -4.5,
    sparkline: [780, 750, 760, 740, 720, 730, 710, 700, 720, 690, 710, 700, 695, 690],
  },
  {
    label: "Cost Per Lead (CPL)",
    value: "$15.80",
    change: -4.0,
    sparkline: [18, 17.5, 17, 16.8, 16.5, 16.2, 16, 15.8, 16.1, 15.5, 15.9, 16, 15.7, 15.8],
  },
];

function generateDates(count: number): string[] {
  const dates: string[] = [];
  const start = new Date(2026, 5, 29);
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d.toLocaleDateString("en-AU", { day: "numeric", month: "short" }));
  }
  return dates;
}

export const dailyTrend: DailyPoint[] = generateDates(30).map((date, i) => ({
  date,
  sessions: 3800 + Math.round(Math.sin(i * 0.5) * 800 + Math.random() * 400),
  leads: 280 + Math.round(Math.sin(i * 0.4) * 60 + Math.random() * 40),
  conversions: 65 + Math.round(Math.sin(i * 0.3) * 15 + Math.random() * 10),
}));

export const leadsByChannel = [
  { channel: "Meta", leads: 3200, color: "#4F9CF7" },
  { channel: "Google", leads: 2800, color: "#3DD9A4" },
  { channel: "Email", leads: 1640, color: "#FF8C42" },
  { channel: "Organic", leads: 1200, color: "#A78BFA" },
  { channel: "Direct", leads: 800, color: "#F472B6" },
];

export const leadsEvents: LeadEvent[] = [
  {
    event: "Registration/Membership Sign Up",
    revenueStreams: { cfs: true, membership: true, ticketing: false, merchandise: false },
    leads: 2840,
    target: 3200,
    variance: -11.3,
    conversionRate: 2.2,
  },
  {
    event: "Email Subscription (CRM/Braze)",
    revenueStreams: { cfs: true, membership: true, ticketing: true, merchandise: true },
    leads: 2180,
    target: 2000,
    variance: 9.0,
    conversionRate: 1.7,
  },
  {
    event: "Contact/Enquiry Form Submit",
    revenueStreams: { cfs: true, membership: true, ticketing: false, merchandise: false },
    leads: 1640,
    target: 1800,
    variance: -8.9,
    conversionRate: 1.3,
  },
  {
    event: "Free Trial/Demo Request (CFS)",
    revenueStreams: { cfs: true, membership: false, ticketing: false, merchandise: false },
    leads: 1420,
    target: 1500,
    variance: -5.3,
    conversionRate: 1.1,
  },
  {
    event: "Add to Cart",
    revenueStreams: { cfs: false, membership: false, ticketing: false, merchandise: true },
    leads: 960,
    target: 1100,
    variance: -12.7,
    conversionRate: 0.7,
  },
  {
    event: "Waiting List/Camp Enquiry",
    revenueStreams: { cfs: true, membership: false, ticketing: false, merchandise: false },
    leads: 600,
    target: 500,
    variance: 20.0,
    conversionRate: 0.5,
  },
];

export const funnelData: FunnelStep[] = [
  { label: "Total Sessions", value: 128400, abandonments: 126000 },
  { label: "Leads", value: 2400, abandonments: 1230 },
  { label: "Conversions", value: 1170 },
];

export const comparisonOptions = [
  { label: "Previous period", value: "pop" },
  { label: "Same period last year", value: "yoy" },
] as const;
