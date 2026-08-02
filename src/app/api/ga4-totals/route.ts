import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { NextRequest } from "next/server";

const GA4_PROPERTY = "properties/396933874";

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

async function queryTotals(client: BetaAnalyticsDataClient, startDate: string, endDate: string) {
  const [sessionsRes, nvrRes, revenueRes] = await Promise.all([
    client.runReport({
      property: GA4_PROPERTY,
      metrics: [{ name: "sessions" }],
      dateRanges: [{ startDate, endDate }],
    }),
    client.runReport({
      property: GA4_PROPERTY,
      dimensions: [{ name: "newVsReturning" }],
      metrics: [{ name: "sessions" }],
      dateRanges: [{ startDate, endDate }],
    }),
    client.runReport({
      property: GA4_PROPERTY,
      metrics: [{ name: "ecommercePurchases" }, { name: "totalRevenue" }],
      dateRanges: [{ startDate, endDate }],
    }),
  ]);

  const sessions = Number(sessionsRes[0]?.rows?.[0]?.metricValues?.[0]?.value ?? 0);
  const purchases = Number(revenueRes[0]?.rows?.[0]?.metricValues?.[0]?.value ?? 0);
  const revenue = Number(revenueRes[0]?.rows?.[0]?.metricValues?.[1]?.value ?? 0);

  let newSessions = 0;
  let returningSessions = 0;
  for (const row of nvrRes[0]?.rows ?? []) {
    const nvr = row.dimensionValues?.[0]?.value;
    const s = Number(row.metricValues?.[0]?.value ?? 0);
    if (nvr === "new") newSessions = s;
    else if (nvr === "returning") returningSessions = s;
  }

  return { sessions, newSessions, returningSessions, purchases, revenue };
}

export async function GET(request: NextRequest) {
  const startDate = request.nextUrl.searchParams.get("startDate");
  const endDate = request.nextUrl.searchParams.get("endDate");

  if (!startDate || !endDate) {
    return Response.json({ error: "startDate and endDate required" }, { status: 400 });
  }

  try {
    const client = getClient();
    const [prevStart, prevEnd] = previousRange(startDate, endDate);

    const [current, previous] = await Promise.all([
      queryTotals(client, startDate, endDate),
      queryTotals(client, prevStart, prevEnd),
    ]);

    return Response.json({ current, previous });
  } catch (err) {
    console.error("GA4 totals error:", err);
    return Response.json({ error: "Failed to fetch GA4 totals" }, { status: 500 });
  }
}
