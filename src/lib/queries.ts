import { supabase } from "./supabase";

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
  dailySessions: { date: string; sessions: number; new_sessions: number; returning_sessions: number }[];
  dailyLeads: Record<string, number>;
  dailyConversions: Record<string, number>;
  dailyRevenue: Record<string, number>;
  channelSessions: { channel: string; sessions: number }[];
  leadEvents: {
    dashboard_label: string;
    revenue_stream: string;
    event_count: number;
  }[];
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function previousRange(start: string, end: string): [string, string] {
  const s = new Date(start);
  const e = new Date(end);
  const days = Math.round((e.getTime() - s.getTime()) / 86400000);
  const prevEnd = new Date(s);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - days);
  return [prevStart.toISOString().slice(0, 10), prevEnd.toISOString().slice(0, 10)];
}

export async function fetchDashboardData(
  startDate: string,
  endDate: string
): Promise<DashboardData> {
  const [prevStart, prevEnd] = previousRange(startDate, endDate);

  const [
    sessionsRes,
    prevSessionsRes,
    channelRes,
    eventsRes,
    prevEventsRes,
    revenueRes,
    prevRevenueRes,
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
  ]);

  const daily = sessionsRes.data ?? [];
  const sessions = daily.reduce((s, r) => s + r.sessions, 0);
  const newSessions = daily.reduce((s, r) => s + r.new_sessions, 0);
  const returningSessions = daily.reduce((s, r) => s + r.returning_sessions, 0);

  const prevDaily = prevSessionsRes.data ?? [];
  const prevSessions = prevDaily.reduce((s, r) => s + r.sessions, 0);
  const prevNewSessions = prevDaily.reduce((s, r) => s + r.new_sessions, 0);
  const prevReturningSessions = prevDaily.reduce((s, r) => s + r.returning_sessions, 0);

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
  const revenue = revRows.reduce((s, r) => s + Number(r.revenue), 0);
  const purchases = revRows.reduce((s, r) => s + r.purchases, 0);

  const prevRevRows = prevRevenueRes.data ?? [];
  const prevRevenue = prevRevRows.reduce((s, r) => s + Number(r.revenue), 0);

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

  // Daily revenue keyed by date
  const dailyRevenue: Record<string, number> = {};
  for (const r of revRows) {
    dailyRevenue[r.date] = Number(r.revenue);
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

  return {
    sessions, newSessions, returningSessions,
    conversions, leads, revenue, purchases,
    prevSessions, prevNewSessions, prevReturningSessions,
    prevConversions, prevLeads, prevRevenue,
    dailySessions: daily,
    dailyLeads, dailyConversions, dailyRevenue,
    channelSessions, leadEvents,
  };
}

export { pctChange };
