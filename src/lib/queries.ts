import { supabase } from "./supabase";

interface GA4Totals {
  current: { sessions: number; newSessions: number; returningSessions: number; purchases: number; revenue: number };
  previous: { sessions: number; newSessions: number; returningSessions: number; purchases: number; revenue: number };
}

async function fetchGA4Totals(startDate: string, endDate: string, comparison: string, stream?: string): Promise<GA4Totals | null> {
  try {
    let url = `/api/ga4-totals?startDate=${startDate}&endDate=${endDate}&comparison=${comparison}`;
    if (stream) url += `&stream=${stream}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchStreamSessions(
  startDate: string,
  endDate: string,
  comparison: string,
  stream: string
): Promise<{ sessions: number; prevSessions: number } | null> {
  const totals = await fetchGA4Totals(startDate, endDate, comparison, stream);
  if (!totals) return null;
  return { sessions: totals.current.sessions, prevSessions: totals.previous.sessions };
}

export interface DashboardData {
  sessions: number;
  newSessions: number;
  returningSessions: number;
  conversions: number;
  leads: number;
  revenue: number;
  purchases: number;
  prevSessions: number;
  prevNewSessions: number;
  prevReturningSessions: number;
  prevConversions: number;
  prevLeads: number;
  prevRevenue: number;
  prevPurchases: number;
  dailySessions: { date: string; sessions: number; new_sessions: number; returning_sessions: number }[];
  dailyLeads: Record<string, number>;
  dailyConversions: Record<string, number>;
  dailyRevenue: Record<string, number>;
  dailyPurchases: Record<string, number>;
  channelSessions: { channel: string; sessions: number }[];
  leadEvents: {
    dashboard_label: string;
    revenue_stream: string;
    event_count: number;
  }[];
  conversionEvents: {
    revenue_stream: string;
    event_count: number;
  }[];
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function previousRange(start: string, end: string, comparison: string): [string, string] {
  const s = new Date(start);
  const e = new Date(end);
  if (comparison === "yoy") {
    const prevStart = new Date(s);
    prevStart.setFullYear(prevStart.getFullYear() - 1);
    const prevEnd = new Date(e);
    prevEnd.setFullYear(prevEnd.getFullYear() - 1);
    return [prevStart.toISOString().slice(0, 10), prevEnd.toISOString().slice(0, 10)];
  }
  const days = Math.round((e.getTime() - s.getTime()) / 86400000);
  const prevEnd = new Date(s);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - days);
  return [prevStart.toISOString().slice(0, 10), prevEnd.toISOString().slice(0, 10)];
}

export async function fetchDashboardData(
  startDate: string,
  endDate: string,
  comparison: string = "pop"
): Promise<DashboardData> {
  const [prevStart, prevEnd] = previousRange(startDate, endDate, comparison);

  const [
    sessionsRes,
    prevSessionsRes,
    channelRes,
    eventsRes,
    prevEventsRes,
    revenueRes,
    prevRevenueRes,
    ga4Totals,
  ] = await Promise.all([
    supabase
      .from("daily_sessions")
      .select("date,sessions,new_sessions,returning_sessions")
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date"),
    supabase
      .from("daily_sessions")
      .select("sessions,new_sessions,returning_sessions")
      .gte("date", prevStart)
      .lte("date", prevEnd),
    supabase
      .from("daily_channel_sessions")
      .select("channel,sessions")
      .gte("date", startDate)
      .lte("date", endDate),
    supabase
      .from("daily_events")
      .select("date,event_name,event_source,classification,dashboard_label,revenue_stream,event_count")
      .gte("date", startDate)
      .lte("date", endDate),
    supabase
      .from("daily_events")
      .select("classification,event_count")
      .gte("date", prevStart)
      .lte("date", prevEnd),
    supabase
      .from("daily_revenue")
      .select("date,purchases,revenue")
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date"),
    supabase
      .from("daily_revenue")
      .select("purchases,revenue")
      .gte("date", prevStart)
      .lte("date", prevEnd),
    fetchGA4Totals(startDate, endDate, comparison),
  ]);

  const daily = sessionsRes.data ?? [];
  // Supabase sums as fallback
  const sbSessions = daily.reduce((s, r) => s + r.sessions, 0);
  const sbNewSessions = daily.reduce((s, r) => s + r.new_sessions, 0);
  const sbReturningSessions = daily.reduce((s, r) => s + r.returning_sessions, 0);

  const prevDaily = prevSessionsRes.data ?? [];
  const sbPrevSessions = prevDaily.reduce((s, r) => s + r.sessions, 0);
  const sbPrevNewSessions = prevDaily.reduce((s, r) => s + r.new_sessions, 0);
  const sbPrevReturningSessions = prevDaily.reduce((s, r) => s + r.returning_sessions, 0);

  // Use live GA4 dimensionless totals for KPI cards (exact match to Data Studio)
  const sessions = ga4Totals?.current.sessions ?? sbSessions;
  const newSessions = ga4Totals?.current.newSessions ?? sbNewSessions;
  const returningSessions = ga4Totals?.current.returningSessions ?? sbReturningSessions;
  const prevSessions = ga4Totals?.previous.sessions ?? sbPrevSessions;
  const prevNewSessions = ga4Totals?.previous.newSessions ?? sbPrevNewSessions;
  const prevReturningSessions = ga4Totals?.previous.returningSessions ?? sbPrevReturningSessions;

  const events = eventsRes.data ?? [];
  const leads = events
    .filter((e) => e.classification === "lead")
    .reduce((s, e) => s + e.event_count, 0);
  const conversions = events
    .filter((e) => e.classification === "conversion")
    .reduce((s, e) => s + e.event_count, 0);

  const prevEvents = prevEventsRes.data ?? [];
  const prevLeads = prevEvents
    .filter((e) => e.classification === "lead")
    .reduce((s, e) => s + e.event_count, 0);
  const prevConversions = prevEvents
    .filter((e) => e.classification === "conversion")
    .reduce((s, e) => s + e.event_count, 0);

  const revRows = revenueRes.data ?? [];
  const sbRevenue = revRows.reduce((s, r) => s + Number(r.revenue), 0);
  const sbPurchases = revRows.reduce((s, r) => s + r.purchases, 0);

  const prevRevRows = prevRevenueRes.data ?? [];
  const sbPrevRevenue = prevRevRows.reduce((s, r) => s + Number(r.revenue), 0);
  const sbPrevPurchases = prevRevRows.reduce((s, r) => s + r.purchases, 0);

  const revenue = ga4Totals?.current.revenue ?? sbRevenue;
  const purchases = ga4Totals?.current.purchases ?? sbPurchases;
  const prevRevenue = ga4Totals?.previous.revenue ?? sbPrevRevenue;
  const prevPurchases = ga4Totals?.previous.purchases ?? sbPrevPurchases;

  // Daily leads/conversions keyed by date
  const dailyLeads: Record<string, number> = {};
  const dailyConversions: Record<string, number> = {};
  for (const e of events) {
    if (e.classification === "lead") {
      dailyLeads[e.date] = (dailyLeads[e.date] ?? 0) + e.event_count;
    } else if (e.classification === "conversion") {
      dailyConversions[e.date] = (dailyConversions[e.date] ?? 0) + e.event_count;
    }
  }

  // Daily revenue and purchases keyed by date
  const dailyRevenue: Record<string, number> = {};
  const dailyPurchases: Record<string, number> = {};
  for (const r of revRows) {
    dailyRevenue[r.date] = Number(r.revenue);
    dailyPurchases[r.date] = r.purchases;
  }

  // Channel sessions aggregated
  const channelMap: Record<string, number> = {};
  for (const r of channelRes.data ?? []) {
    channelMap[r.channel] = (channelMap[r.channel] ?? 0) + r.sessions;
  }
  const channelSessions = Object.entries(channelMap)
    .map(([channel, sessions]) => ({ channel, sessions }))
    .sort((a, b) => b.sessions - a.sessions);

  // Lead events aggregated
  const leadMap: Record<string, { dashboard_label: string; revenue_stream: string; event_count: number }> = {};
  for (const e of events) {
    if (e.classification !== "lead") continue;
    const key = `${e.dashboard_label}|${e.revenue_stream}`;
    if (!leadMap[key]) {
      leadMap[key] = { dashboard_label: e.dashboard_label, revenue_stream: e.revenue_stream, event_count: 0 };
    }
    leadMap[key].event_count += e.event_count;
  }
  const leadEvents = Object.values(leadMap).sort((a, b) => b.event_count - a.event_count);

  // Conversion events aggregated by revenue stream
  const convMap: Record<string, { revenue_stream: string; event_count: number }> = {};
  for (const e of events) {
    if (e.classification !== "conversion") continue;
    const key = e.revenue_stream;
    if (!convMap[key]) {
      convMap[key] = { revenue_stream: e.revenue_stream, event_count: 0 };
    }
    convMap[key].event_count += e.event_count;
  }
  const conversionEvents = Object.values(convMap);

  return {
    sessions, newSessions, returningSessions,
    conversions, leads, revenue, purchases,
    prevSessions, prevNewSessions, prevReturningSessions,
    prevConversions, prevLeads, prevRevenue, prevPurchases,
    dailySessions: daily,
    dailyLeads, dailyConversions, dailyRevenue, dailyPurchases,
    channelSessions, leadEvents, conversionEvents,
  };
}

export { pctChange };
