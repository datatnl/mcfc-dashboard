import type { LeadEvent } from "@/lib/dummy-data";

interface LeadsEventTableProps {
  events: LeadEvent[];
}

function StreamBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-6 h-5 rounded text-[9px] font-bold ${
        active
          ? "bg-[#2dd4a8] text-white"
          : "bg-gray-100 text-gray-400"
      }`}
    >
      {label}
    </span>
  );
}

export default function LeadsEventTable({ events }: LeadsEventTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left">
            <th className="px-3 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">#</th>
            <th className="px-3 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Lead Event</th>
            <th className="px-3 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">Revenue Streams</th>
            <th className="px-3 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Leads</th>
            <th className="px-3 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Target</th>
            <th className="px-3 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Variance</th>
            <th className="px-3 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Conv. Rate</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event, i) => (
            <tr key={event.event} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
              <td className="px-3 py-2.5 text-gray-400 text-xs">{i + 1}.</td>
              <td className="px-3 py-2.5 text-gray-800 font-medium text-xs">{event.event}</td>
              <td className="px-3 py-2.5">
                <div className="flex items-center justify-center gap-1">
                  <StreamBadge active={event.revenueStreams.cfs} label="C" />
                  <StreamBadge active={event.revenueStreams.membership} label="M" />
                  <StreamBadge active={event.revenueStreams.ticketing} label="T" />
                  <StreamBadge active={event.revenueStreams.merchandise} label="S" />
                </div>
              </td>
              <td className="px-3 py-2.5 text-right font-semibold text-gray-900">{event.leads.toLocaleString()}</td>
              <td className="px-3 py-2.5 text-right text-gray-500">{event.target.toLocaleString()}</td>
              <td className={`px-3 py-2.5 text-right font-semibold ${event.variance >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {event.variance >= 0 ? "+" : ""}{event.variance}%
              </td>
              <td className="px-3 py-2.5 text-right text-gray-600">{event.conversionRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
