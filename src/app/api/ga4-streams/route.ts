import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { NextRequest } from "next/server";

const GA4_PROPERTY = "properties/396933874";

const HOSTNAME_TO_STREAM: Record<string, string> = {
  "play.melbournecityfc.com.au": "CFS",
  "portal.iclasspro.com": "CFS",
  "account.melbournecityfc.com.au": "Membership",
  "premier.sportsubs.com.au": "Membership",
  "melbournecityfc.com.au": "Main Site",
  "www.melbournecityfc.com.au": "Main Site",
  "store.melbournecityfc.com.au": "Merchandise",
  "shop.melbournecityfc.com.au": "Merchandise",
};

function getClient() {
  const b64 = process.env.GA4_SERVICE_ACCOUNT_KEY;
  if (!b64) throw new Error("GA4_SERVICE_ACCOUNT_KEY not set");
  const creds = JSON.parse(Buffer.from(b64, "base64").toString("utf-8"));
  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: creds.client_email,
      private_key: creds.private_key,
    },
  });
}

export async function GET(request: NextRequest) {
  const startDate = request.nextUrl.searchParams.get("startDate");
  const endDate = request.nextUrl.searchParams.get("endDate");

  if (!startDate || !endDate) {
    return Response.json({ error: "startDate and endDate required" }, { status: 400 });
  }

  try {
    const client = getClient();

    const [sessionsRes, revenueRes, nvrRes] = await Promise.all([
      client.runReport({
        property: GA4_PROPERTY,
        dimensions: [{ name: "hostName" }],
        metrics: [
          { name: "sessions" },
          { name: "bounceRate" },
          { name: "engagedSessions" },
          { name: "screenPageViewsPerSession" },
        ],
        dateRanges: [{ startDate, endDate }],
      }),
      client.runReport({
        property: GA4_PROPERTY,
        dimensions: [{ name: "hostName" }],
        metrics: [
          { name: "ecommercePurchases" },
          { name: "totalRevenue" },
        ],
        dateRanges: [{ startDate, endDate }],
      }),
      client.runReport({
        property: GA4_PROPERTY,
        dimensions: [{ name: "hostName" }, { name: "newVsReturning" }],
        metrics: [{ name: "sessions" }],
        dateRanges: [{ startDate, endDate }],
      }),
    ]);

    interface StreamData {
      stream: string;
      sessions: number;
      newSessions: number;
      returningSessions: number;
      bounceRate: number;
      engagedSessions: number;
      pagesPerSession: number;
      purchases: number;
      revenue: number;
      _totalBounceWeighted: number;
      _totalPpsWeighted: number;
    }

    const streams: Record<string, StreamData> = {};
    const init = (name: string): StreamData => ({
      stream: name,
      sessions: 0,
      newSessions: 0,
      returningSessions: 0,
      bounceRate: 0,
      engagedSessions: 0,
      pagesPerSession: 0,
      purchases: 0,
      revenue: 0,
      _totalBounceWeighted: 0,
      _totalPpsWeighted: 0,
    });

    for (const row of sessionsRes[0]?.rows ?? []) {
      const host = row.dimensionValues?.[0]?.value ?? "";
      const stream = HOSTNAME_TO_STREAM[host];
      if (!stream) continue;
      if (!streams[stream]) streams[stream] = init(stream);
      const s = Number(row.metricValues?.[0]?.value ?? 0);
      const br = Number(row.metricValues?.[1]?.value ?? 0);
      const engaged = Number(row.metricValues?.[2]?.value ?? 0);
      const pps = Number(row.metricValues?.[3]?.value ?? 0);
      streams[stream].sessions += s;
      streams[stream].engagedSessions += engaged;
      streams[stream]._totalBounceWeighted += br * s;
      streams[stream]._totalPpsWeighted += pps * s;
    }

    for (const row of revenueRes[0]?.rows ?? []) {
      const host = row.dimensionValues?.[0]?.value ?? "";
      const stream = HOSTNAME_TO_STREAM[host];
      if (!stream) continue;
      if (!streams[stream]) streams[stream] = init(stream);
      streams[stream].purchases += Number(row.metricValues?.[0]?.value ?? 0);
      streams[stream].revenue += Number(row.metricValues?.[1]?.value ?? 0);
    }

    for (const row of nvrRes[0]?.rows ?? []) {
      const host = row.dimensionValues?.[0]?.value ?? "";
      const nvr = row.dimensionValues?.[1]?.value ?? "";
      const stream = HOSTNAME_TO_STREAM[host];
      if (!stream) continue;
      if (!streams[stream]) streams[stream] = init(stream);
      const s = Number(row.metricValues?.[0]?.value ?? 0);
      if (nvr === "new") streams[stream].newSessions += s;
      else if (nvr === "returning") streams[stream].returningSessions += s;
    }

    // Compute weighted averages
    const result = Object.values(streams).map((s) => ({
      stream: s.stream,
      sessions: s.sessions,
      newSessions: s.newSessions,
      returningSessions: s.returningSessions,
      bounceRate: s.sessions > 0 ? s._totalBounceWeighted / s.sessions : 0,
      engagedSessions: s.engagedSessions,
      pagesPerSession: s.sessions > 0 ? s._totalPpsWeighted / s.sessions : 0,
      purchases: s.purchases,
      revenue: Math.round(s.revenue * 100) / 100,
      cvr: s.sessions > 0 ? (s.purchases / s.sessions) * 100 : 0,
      newPct: s.sessions > 0 ? (s.newSessions / s.sessions) * 100 : 0,
    }));

    result.sort((a, b) => b.sessions - a.sessions);

    return Response.json({ streams: result });
  } catch (err) {
    console.error("GA4 streams error:", err);
    return Response.json({ error: "Failed to fetch GA4 stream data" }, { status: 500 });
  }
}
