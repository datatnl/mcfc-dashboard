"use client";

import { useEffect, useState } from "react";

interface StreamRow {
  stream: string;
  sessions: number;
  newSessions: number;
  returningSessions: number;
  bounceRate: number;
  engagedSessions: number;
  pagesPerSession: number;
  purchases: number;
  revenue: number;
  cvr: number;
  newPct: number;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function fmtCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
}

function generateInsights(streams: StreamRow[], totalSessions: number, bouncedSessions: number, engagedNonPurch: number, totalPurchasers: number): string[] {
  if (!streams.length || totalSessions === 0) return [];

  const insights: string[] = [];
  const sorted = [...streams].sort((a, b) => b.sessions - a.sessions);
  const highest = sorted[0];
  const bouncePct = (bouncedSessions / totalSessions) * 100;

  // Bounce insight
  const highBounce = sorted.filter(s => s.bounceRate > 0.55);
  if (highBounce.length > 0) {
    const worst = highBounce.sort((a, b) => b.bounceRate - a.bounceRate)[0];
    insights.push(
      `${worst.stream} has the highest bounce rate at ${(worst.bounceRate * 100).toFixed(1)}% — ${fmt(Math.round(worst.sessions * worst.bounceRate))} of its ${fmt(worst.sessions)} sessions leave after a single page. ${bouncePct.toFixed(0)}% of all sessions across the portfolio bounce without engaging.`
    );
  }

  // Traffic concentration
  const topPct = (highest.sessions / totalSessions) * 100;
  insights.push(
    `${highest.stream} accounts for ${topPct.toFixed(0)}% of all traffic (${fmt(highest.sessions)} sessions) but generates ${highest.purchases > 0 ? fmtCurrency(highest.revenue) + " in revenue" : "no direct ecommerce revenue"}. ${highest.purchases === 0 ? "Its role is brand awareness and funnel entry — users land here first before navigating to transactional sites." : ""}`
  );

  // Engagement depth
  const merchStream = streams.find(s => s.stream === "Merchandise");
  const cfsStream = streams.find(s => s.stream === "CFS");
  if (merchStream && merchStream.pagesPerSession > 2) {
    insights.push(
      `Merchandise visitors view ${merchStream.pagesPerSession.toFixed(1)} pages per session on average — the deepest engagement of any stream — and convert at ${merchStream.cvr.toFixed(2)}% with ${fmtCurrency(merchStream.revenue)} in revenue. ${merchStream.newPct < 50 ? "Most Merchandise traffic is returning visitors, suggesting strong purchase intent from repeat browsers." : `${merchStream.newPct.toFixed(0)}% of Merchandise visitors are new, indicating effective acquisition into the store.`}`
    );
  }

  // CFS vs others
  if (cfsStream && cfsStream.sessions > 1000) {
    insights.push(
      `CFS draws ${fmt(cfsStream.sessions)} sessions with a ${(cfsStream.bounceRate * 100).toFixed(1)}% bounce rate — ${cfsStream.bounceRate < 0.5 ? "well below the portfolio average, indicating strong intent from program-seekers" : "on par with the portfolio average"}. ${cfsStream.newPct > 60 ? `${cfsStream.newPct.toFixed(0)}% are first-time visitors, highlighting CFS as a primary acquisition channel for the club.` : "The audience skews returning, suggesting loyal program participants."}`
    );
  }

  return insights;
}

interface StreamBreakdownProps {
  startDate: string;
  endDate: string;
}

export default function StreamBreakdown({ startDate, endDate }: StreamBreakdownProps) {
  const [streams, setStreams] = useState<StreamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSessions, setTotalSessions] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/ga4-streams?startDate=${startDate}&endDate=${endDate}`)
      .then((r) => r.json())
      .then((data) => {
        setStreams(data.streams ?? []);
        setTotalSessions((data.streams ?? []).reduce((s: number, r: StreamRow) => s + r.sessions, 0));
      })
      .catch(() => setStreams([]))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading stream data...
        </div>
      </div>
    );
  }

  if (!streams.length) return null;

  const maxSessions = streams[0]?.sessions ?? 1;

  // Audience composition
  const bouncedSessions = streams.reduce((s, r) => s + Math.round(r.sessions * r.bounceRate), 0);
  const totalEngaged = streams.reduce((s, r) => s + r.engagedSessions, 0);
  const totalPurchasers = streams.reduce((s, r) => s + r.purchases, 0);
  const engagedNonPurch = totalEngaged - totalPurchasers;

  const bouncedPct = totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0;
  const engagedPct = totalSessions > 0 ? (engagedNonPurch / totalSessions) * 100 : 0;
  const purchaserPct = totalSessions > 0 ? (totalPurchasers / totalSessions) * 100 : 0;

  const avgPpsAll = totalSessions > 0
    ? streams.reduce((s, r) => s + r.pagesPerSession * r.sessions, 0) / totalSessions
    : 0;
  const avgPpsEngaged = totalEngaged > 0
    ? streams.reduce((s, r) => s + r.pagesPerSession * r.engagedSessions, 0) / totalEngaged
    : 0;
  const avgPpsPurchaser = totalPurchasers > 0
    ? (() => {
        const merch = streams.find(s => s.stream === "Merchandise");
        return merch ? merch.pagesPerSession : avgPpsEngaged;
      })()
    : 0;

  const insights = generateInsights(streams, totalSessions, bouncedSessions, engagedNonPurch, totalPurchasers);

  return (
    <div>
      {/* Audience composition */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Bounced</div>
          <div className="mt-1">
            <span className="text-2xl font-bold text-gray-900">{bouncedPct.toFixed(1)}%</span>
            <span className="text-xs text-gray-400 ml-1">({fmt(bouncedSessions)} sessions)</span>
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">{avgPpsAll.toFixed(1)} avg pages/session overall</div>
        </div>
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Engaged Non-Purchaser</div>
          <div className="mt-1">
            <span className="text-2xl font-bold text-gray-900">{engagedPct.toFixed(1)}%</span>
            <span className="text-xs text-gray-400 ml-1">({fmt(engagedNonPurch)} sessions)</span>
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">{avgPpsEngaged.toFixed(1)} avg pages/session</div>
        </div>
        <div className="border border-[#3bd6ff]/30 rounded-lg p-4 bg-[#3bd6ff]/5">
          <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Engaged Purchaser</div>
          <div className="mt-1">
            <span className="text-2xl font-bold text-[#3bd6ff]">{purchaserPct.toFixed(1)}%</span>
            <span className="text-xs text-gray-400 ml-1">({fmt(totalPurchasers)} purchases)</span>
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">{avgPpsPurchaser.toFixed(1)} avg pages/session</div>
        </div>
      </div>

      {/* Stream breakdown table */}
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Sessions by Revenue Stream</h4>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
              <th className="text-left py-2 pr-4 w-[100px]"></th>
              <th className="text-left py-2 pr-4" style={{ minWidth: "200px" }}></th>
              <th className="text-center py-2 px-3">Bounce</th>
              <th className="text-center py-2 px-3">CVR</th>
              <th className="text-center py-2 px-3">Revenue</th>
              <th className="text-center py-2 px-3">New %</th>
              <th className="text-center py-2 px-3">Pages/Sess</th>
            </tr>
          </thead>
          <tbody>
            {streams.map((s) => {
              const barPct = (s.sessions / maxSessions) * 100;
              const bounceHigh = s.bounceRate > 0.6;
              const cvrHigh = s.cvr > 1;

              return (
                <tr key={s.stream} className="border-t border-gray-50">
                  <td className="py-3 pr-4 text-right">
                    <span className="text-sm font-semibold text-gray-700">{s.stream}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-7 bg-gray-50 rounded overflow-hidden">
                        <div
                          className="h-full bg-[#3bd6ff] rounded flex items-center px-2"
                          style={{ width: `${Math.max(barPct, 8)}%` }}
                        >
                          <span className="text-[11px] font-bold text-white whitespace-nowrap">
                            {fmt(s.sessions)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`text-xs font-semibold ${bounceHigh ? "text-red-500" : "text-gray-500"}`}>
                      {(s.bounceRate * 100).toFixed(1)}%
                    </span>
                    <div className="text-[9px] text-gray-400">bounce</div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`text-xs font-semibold ${cvrHigh ? "text-[#3bd6ff]" : "text-gray-500"}`}>
                      {s.cvr.toFixed(2)}%
                    </span>
                    <div className="text-[9px] text-gray-400">CVR</div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="text-xs font-semibold text-gray-700">{fmtCurrency(s.revenue)}</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="text-xs font-semibold text-gray-500">{s.newPct.toFixed(0)}%</span>
                    <div className="text-[9px] text-gray-400">new</div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="text-xs font-semibold text-gray-500">{s.pagesPerSession.toFixed(1)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Behaviour Analysis
          </h4>
          {insights.map((insight, i) => (
            <div
              key={i}
              className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
            >
              <div className="w-5 h-5 rounded-full bg-[#3bd6ff]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-[#3bd6ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-[13px] text-gray-600 leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
