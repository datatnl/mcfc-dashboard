"use client";

import { useState, useEffect, useCallback } from "react";
import DateRangePicker from "@/components/DateRangePicker";
import SectionHeader from "@/components/SectionHeader";
import KpiCard from "@/components/KpiCard";
import TrendChart from "@/components/TrendChart";
import LeadsChannelChart from "@/components/LeadsChannelChart";
import LeadsEventTable from "@/components/LeadsEventTable";
import FunnelChart from "@/components/FunnelChart";
import { fetchDashboardData, pctChange } from "@/lib/queries";
import type { KpiMetric, DailyPoint, FunnelStep, LeadEvent } from "@/lib/live-data";

const CHANNEL_COLORS: Record<string, string> = {
  "Direct": "#F472B6",
  "Organic Search": "#3DD9A4",
  "Paid Social": "#4F9CF7",
  "Organic Social": "#A78BFA",
  "Referral": "#FB923C",
  "Cross-network": "#2dd4a8",
  "Unassigned": "#94A3B8",
  "Paid Search": "#818CF8",
  "AI Assistant": "#22D3EE",
  "Email": "#FF8C42",
  "Organic Shopping": "#86EFAC",
  "Paid Other": "#FDA4AF",
  "Paid Video": "#FCD34D",
  "Display": "#D8B4FE",
  "Paid Shopping": "#FDBA74",
};

const STREAM_MAP: Record<string, keyof LeadEvent["revenueStreams"]> = {
  CFS: "cfs",
  Membership: "membership",
  "Main Site": "ticketing",
  Merchandise: "merchandise",
  all: "cfs",
};

function fmt(n: number, prefix = ""): string {
  if (prefix === "$") return `$${Math.round(n).toLocaleString()}`;
  return n.toLocaleString();
}

export default function MasterDashboard() {
  const [comparison, setComparison] = useState("pop");
  const [startDate, setStartDate] = useState("2026-06-29");
  const [endDate, setEndDate] = useState("2026-07-28");
  const [funnelFilter, setFunnelFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const [behaviourKpis, setBehaviourKpis] = useState<KpiMetric[]>([]);
  const [leadsKpis, setLeadsKpis] = useState<KpiMetric[]>([]);
  const [dailyTrend, setDailyTrend] = useState<DailyPoint[]>([]);
  const [channelData, setChannelData] = useState<{ channel: string; leads: number; color: string }[]>([]);
  const [leadsEvents, setLeadsEvents] = useState<LeadEvent[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelStep[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchDashboardData(startDate, endDate);

      const sessionsSpark = d.dailySessions.map((r) => r.sessions);
      const newSpark = d.dailySessions.map((r) => r.new_sessions);
      const retSpark = d.dailySessions.map((r) => r.returning_sessions);
      const convSpark = d.dailySessions.map((r) => d.dailyConversions[r.date] ?? 0);
      const revSpark = d.dailySessions.map((r) => Math.round(d.dailyRevenue[r.date] ?? 0));
      const leadsSpark = d.dailySessions.map((r) => d.dailyLeads[r.date] ?? 0);

      setBehaviourKpis([
        { label: "Total Web Sessions", value: fmt(d.sessions), change: pctChange(d.sessions, d.prevSessions), sparkline: sessionsSpark },
        { label: "First Visits", value: fmt(d.newSessions), change: pctChange(d.newSessions, d.prevNewSessions), sparkline: newSpark },
        { label: "Repeat Visits", value: fmt(d.returningSessions), change: pctChange(d.returningSessions, d.prevReturningSessions), sparkline: retSpark },
        { label: "Total Conversions", value: fmt(d.conversions), change: pctChange(d.conversions, d.prevConversions), sparkline: convSpark },
        { label: "Revenue", value: fmt(d.revenue, "$"), change: pctChange(d.revenue, d.prevRevenue), sparkline: revSpark },
        { label: "ROAS", value: "—", change: 0, sparkline: [], unavailable: true },
      ]);

      setLeadsKpis([
        { label: "Total Email Subscriptions", value: "—", change: 0, sparkline: [], unavailable: true },
        { label: "Total Leads", value: fmt(d.leads), change: pctChange(d.leads, d.prevLeads), sparkline: leadsSpark },
        { label: "Cost Per Lead (CPL)", value: "—", change: 0, sparkline: [], unavailable: true },
      ]);

      const trend: DailyPoint[] = d.dailySessions.map((r) => {
        const dt = new Date(r.date);
        const label = dt.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
        return {
          date: label,
          sessions: r.sessions,
          leads: d.dailyLeads[r.date] ?? 0,
          conversions: d.dailyConversions[r.date] ?? 0,
        };
      });
      setDailyTrend(trend);

      setChannelData(
        d.channelSessions.map((c) => ({
          channel: c.channel,
          leads: c.sessions,
          color: CHANNEL_COLORS[c.channel] ?? "#94A3B8",
        }))
      );

      setLeadsEvents(
        d.leadEvents.map((e) => {
          const streamKey = STREAM_MAP[e.revenue_stream];
          const streams = { cfs: false, membership: false, ticketing: false, merchandise: false };
          if (e.revenue_stream === "all") {
            streams.cfs = true; streams.membership = true; streams.ticketing = true; streams.merchandise = true;
          } else if (streamKey) {
            streams[streamKey] = true;
          }
          return {
            event: e.dashboard_label,
            revenueStreams: streams,
            leads: e.event_count,
            target: 0,
            variance: 0,
            conversionRate: d.sessions > 0 ? Math.round((e.event_count / d.sessions) * 10000) / 100 : 0,
          };
        })
      );

      const totalLeads = d.leads;
      setFunnelData([
        { label: "Total Sessions", value: d.sessions, abandonments: d.sessions - totalLeads },
        { label: "Leads", value: totalLeads, abandonments: totalLeads - d.conversions },
        { label: "Conversions", value: d.conversions },
      ]);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="p-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#2dd4a8] flex items-center justify-center text-white font-bold text-lg">
            MCFC
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">MASTER DASHBOARD</h1>
            <p className="text-sm text-gray-400">
              melbournecityfc.com.au — all revenue streams combined
            </p>
          </div>
        </div>
        <DateRangePicker
          comparison={comparison}
          onComparisonChange={setComparison}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
      </div>

      {(loading || behaviourKpis.length === 0) && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-sm text-gray-400">Loading dashboard data...</div>
        </div>
      )}

      {!loading && behaviourKpis.length > 0 && <>
      {/* BEHAVIOUR Section */}
      <section className="bg-white rounded-xl p-6 mb-6">
        <SectionHeader
          title="BEHAVIOUR"
          subtitle="Top-line performance vs target, last week and last year"
        />

        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {behaviourKpis.map((metric) => (
            <KpiCard key={metric.label} metric={metric} comparison={comparison} />
          ))}
        </div>

        <div className="mt-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            Sessions, Leads &amp; Conversions — daily trend
          </h3>
          <TrendChart data={dailyTrend} />
        </div>
      </section>

      {/* LEADS Section */}
      <section className="bg-white rounded-xl p-6 mb-6">
        <SectionHeader
          title="LEADS"
          subtitle="Lead volume, source and cost — where demand is coming from"
        />

        <div className="grid grid-cols-3 gap-3 mb-6">
          {leadsKpis.map((metric) => (
            <KpiCard key={metric.label} metric={metric} comparison={comparison} />
          ))}
        </div>

        <div className="grid grid-cols-12 gap-4 mb-6">
          <div className="col-span-12 lg:col-span-7">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Leads by channel
              </h4>
              <p className="text-[10px] text-gray-400 mb-2">Session default channel group</p>
              <div className="h-[420px]">
                <LeadsChannelChart data={channelData} />
              </div>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Leads by Lead Event</h3>
              <LeadsEventTable events={leadsEvents} />
            </div>
          </div>
        </div>

      </section>

      {/* JOURNEYS Section */}
      <section className="bg-white rounded-xl p-6 mb-6">
        <SectionHeader
          title="JOURNEYS"
          subtitle="Sessions to leads to conversions, top paths and drop-offs (by CFS location)"
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Filter by Revenue Stream
            </span>
            <select
              value={funnelFilter}
              onChange={(e) => setFunnelFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-md px-3 py-1.5 text-sm text-gray-700 min-w-[180px] appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 10px center",
              }}
            >
              <option value="all">All Revenue Streams</option>
              <option value="cfs">CFS</option>
              <option value="membership">Membership</option>
              <option value="ticketing">Ticketing</option>
              <option value="merchandise">Merchandise</option>
            </select>
          </div>
        </SectionHeader>

        <FunnelChart steps={funnelData} />
      </section>

      </>}

      {/* Footer */}
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded bg-[#2dd4a8]" />
        </div>
        <p className="text-xs text-gray-500">
          Prepared by Tell No Lies {new Date().getFullYear()}
        </p>
        <p className="text-[10px] text-gray-600 mt-1 bg-emerald-50 border border-emerald-200 inline-block rounded px-3 py-1">
          GA4 live data · ROAS/CPL awaiting ad spend · Membership events pending
        </p>
      </div>
    </div>
  );
}
