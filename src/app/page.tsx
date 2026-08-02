"use client";

import { useState } from "react";
import DateRangePicker from "@/components/DateRangePicker";
import SectionHeader from "@/components/SectionHeader";
import KpiCard from "@/components/KpiCard";
import TrendChart from "@/components/TrendChart";
import LeadsChannelChart from "@/components/LeadsChannelChart";
import LeadsEventTable from "@/components/LeadsEventTable";
import FunnelChart from "@/components/FunnelChart";
import {
  behaviourKpis,
  leadsKpis,
  dailyTrend,
  leadsByChannel,
  leadsEvents,
  funnelData,
} from "@/lib/live-data";

export default function MasterDashboard() {
  const [comparison, setComparison] = useState("pop");
  const [startDate, setStartDate] = useState("2026-06-29");
  const [endDate, setEndDate] = useState("2026-07-28");
  const [funnelFilter, setFunnelFilter] = useState("all");

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

        <div className="grid grid-cols-12 gap-4 mb-6">
          <div className="col-span-12 lg:col-span-5">
            <div className="grid grid-cols-3 gap-3">
              {leadsKpis.map((metric) => (
                <KpiCard key={metric.label} metric={metric} comparison={comparison} />
              ))}
            </div>
          </div>
          <div className="col-span-12 lg:col-span-7">
            <div className="bg-gray-50 rounded-lg p-4 h-full">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Sessions by Channel
              </h4>
              <p className="text-[10px] text-gray-400 mb-3">Direct / Google / Meta / Organic / Other / Email</p>
              <div className="h-[180px]">
                <LeadsChannelChart data={leadsByChannel} />
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Leads by Lead Event</h3>
          <LeadsEventTable events={leadsEvents} />
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

      {/* Footer */}
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded bg-[#2dd4a8]" />
        </div>
        <p className="text-xs text-gray-500">
          Prepared by Tell No Lies {new Date().getFullYear()}
        </p>
        <p className="text-[10px] text-gray-600 mt-1 bg-emerald-50 border border-emerald-200 inline-block rounded px-3 py-1">
          GA4 live data · 29 Jun – 28 Jul 2026 · ROAS/CPL awaiting ad spend · Membership events pending
        </p>
      </div>
    </div>
  );
}
