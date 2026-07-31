"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface DateRangePickerProps {
  comparison: string;
  onComparisonChange: (value: string) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
}

interface Preset {
  label: string;
  start: string;
  end: string;
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildPresets(): Preset[] {
  const today = new Date(2026, 6, 28);
  const d = (offset: number) => {
    const r = new Date(today);
    r.setDate(r.getDate() + offset);
    return r;
  };

  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  const lastMonthStart = new Date(lastMonthEnd.getFullYear(), lastMonthEnd.getMonth(), 1);
  const thisQuarterMonth = Math.floor(today.getMonth() / 3) * 3;
  const thisQuarterStart = new Date(today.getFullYear(), thisQuarterMonth, 1);
  const lastQuarterStart = new Date(today.getFullYear(), thisQuarterMonth - 3, 1);
  const lastQuarterEnd = new Date(today.getFullYear(), thisQuarterMonth, 0);
  const thisYearStart = new Date(today.getFullYear(), 0, 1);

  return [
    { label: "Today", start: toISO(today), end: toISO(today) },
    { label: "Yesterday", start: toISO(d(-1)), end: toISO(d(-1)) },
    { label: "Last 7 days", start: toISO(d(-6)), end: toISO(today) },
    { label: "Last 14 days", start: toISO(d(-13)), end: toISO(today) },
    { label: "Last 28 days", start: toISO(d(-27)), end: toISO(today) },
    { label: "Last 30 days", start: toISO(d(-29)), end: toISO(today) },
    { label: "Last 90 days", start: toISO(d(-89)), end: toISO(today) },
    { label: "This month", start: toISO(thisMonthStart), end: toISO(today) },
    { label: "Last month", start: toISO(lastMonthStart), end: toISO(lastMonthEnd) },
    { label: "This quarter", start: toISO(thisQuarterStart), end: toISO(today) },
    { label: "Last quarter", start: toISO(lastQuarterStart), end: toISO(lastQuarterEnd) },
    { label: "This year", start: toISO(thisYearStart), end: toISO(today) },
  ];
}

const PRESETS = buildPresets();

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function CalendarMonth({
  year,
  month,
  rangeStart,
  rangeEnd,
  onSelect,
}: {
  year: number;
  month: number;
  rangeStart: string;
  rangeEnd: string;
  onSelect: (date: string) => void;
}) {
  const days = daysInMonth(year, month);
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
  const monthName = new Date(year, month, 1).toLocaleDateString("en-AU", { month: "long", year: "numeric" });
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="min-w-[220px]">
      <div className="text-xs font-semibold text-gray-700 text-center mb-2">{monthName}</div>
      <div className="grid grid-cols-7 gap-0 text-center">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i} className="text-[10px] text-gray-400 font-medium py-1">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const iso = toISO(new Date(year, month, day));
          const isStart = iso === rangeStart;
          const isEnd = iso === rangeEnd;
          const inRange = iso >= rangeStart && iso <= rangeEnd;
          return (
            <button
              key={i}
              onClick={() => onSelect(iso)}
              className={`text-[11px] py-1 rounded transition-colors ${
                isStart || isEnd
                  ? "bg-[#2dd4a8] text-white font-bold"
                  : inRange
                    ? "bg-[#2dd4a8]/15 text-gray-700"
                    : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DateRangePicker({
  comparison,
  onComparisonChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [selecting, setSelecting] = useState<"start" | "end">("start");
  const [draftStart, setDraftStart] = useState(startDate);
  const [draftEnd, setDraftEnd] = useState(endDate);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const endD = new Date(draftEnd + "T00:00:00");
  const [calMonth, setCalMonth] = useState(endD.getMonth());
  const [calYear, setCalYear] = useState(endD.getFullYear());

  const prevMonth = calMonth === 0 ? 11 : calMonth - 1;
  const prevYear = calMonth === 0 ? calYear - 1 : calYear;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = useCallback(() => {
    setDraftStart(startDate);
    setDraftEnd(endDate);
    setSelecting("start");
    const ed = new Date(endDate + "T00:00:00");
    setCalMonth(ed.getMonth());
    setCalYear(ed.getFullYear());
    setActivePreset(null);
    setOpen(true);
  }, [startDate, endDate]);

  const handlePreset = (preset: Preset) => {
    setDraftStart(preset.start);
    setDraftEnd(preset.end);
    setActivePreset(preset.label);
    const ed = new Date(preset.end + "T00:00:00");
    setCalMonth(ed.getMonth());
    setCalYear(ed.getFullYear());
  };

  const handleCalSelect = (iso: string) => {
    if (selecting === "start") {
      setDraftStart(iso);
      if (iso > draftEnd) setDraftEnd(iso);
      setSelecting("end");
      setActivePreset(null);
    } else {
      if (iso < draftStart) {
        setDraftStart(iso);
      } else {
        setDraftEnd(iso);
      }
      setSelecting("start");
      setActivePreset(null);
    }
  };

  const handleApply = () => {
    onStartDateChange(draftStart);
    onEndDateChange(draftEnd);
    setOpen(false);
  };

  const navMonth = (dir: -1 | 1) => {
    let m = calMonth + dir;
    let y = calYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setCalMonth(m);
    setCalYear(y);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatShort = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-end gap-1.5 relative" ref={panelRef}>
        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          Date Range
        </label>
        <button
          onClick={handleOpen}
          className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-3 py-1.5 text-sm text-gray-700 min-w-[220px] justify-center hover:border-gray-300 transition-colors"
        >
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formatDate(startDate)} – {formatDate(endDate)}</span>
        </button>

        {open && (
          <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 flex overflow-hidden">
            {/* Preset sidebar */}
            <div className="w-[160px] border-r border-gray-100 py-2 bg-gray-50/50 flex-shrink-0">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Presets
              </div>
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => handlePreset(p)}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                    activePreset === p.label
                      ? "bg-[#2dd4a8]/10 text-[#2dd4a8] font-semibold"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Calendar area */}
            <div className="p-4 flex flex-col min-w-[480px]">
              {/* Date inputs */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1">
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1 block">Start</label>
                  <input
                    type="date"
                    value={draftStart}
                    onChange={(e) => { setDraftStart(e.target.value); setActivePreset(null); }}
                    onFocus={() => setSelecting("start")}
                    className={`w-full border rounded-md px-2.5 py-1.5 text-sm ${
                      selecting === "start" ? "border-[#2dd4a8] ring-1 ring-[#2dd4a8]/30" : "border-gray-200"
                    }`}
                  />
                </div>
                <span className="text-gray-300 mt-4">–</span>
                <div className="flex-1">
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1 block">End</label>
                  <input
                    type="date"
                    value={draftEnd}
                    min={draftStart}
                    onChange={(e) => { setDraftEnd(e.target.value); setActivePreset(null); }}
                    onFocus={() => setSelecting("end")}
                    className={`w-full border rounded-md px-2.5 py-1.5 text-sm ${
                      selecting === "end" ? "border-[#2dd4a8] ring-1 ring-[#2dd4a8]/30" : "border-gray-200"
                    }`}
                  />
                </div>
              </div>

              {/* Display selected range */}
              <div className="text-[11px] text-gray-400 mb-3 text-center">
                {formatShort(draftStart)} – {formatShort(draftEnd)}
                {" "}({Math.round((new Date(draftEnd + "T00:00:00").getTime() - new Date(draftStart + "T00:00:00").getTime()) / 86400000) + 1} days)
              </div>

              {/* Two month calendars */}
              <div className="flex items-start gap-6 mb-4">
                <div className="flex items-center gap-1">
                  <button onClick={() => navMonth(-1)} className="p-1 hover:bg-gray-100 rounded text-gray-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>
                <CalendarMonth
                  year={prevYear}
                  month={prevMonth}
                  rangeStart={draftStart}
                  rangeEnd={draftEnd}
                  onSelect={handleCalSelect}
                />
                <CalendarMonth
                  year={calYear}
                  month={calMonth}
                  rangeStart={draftStart}
                  rangeEnd={draftEnd}
                  onSelect={handleCalSelect}
                />
                <div className="flex items-center gap-1">
                  <button onClick={() => navMonth(1)} className="p-1 hover:bg-gray-100 rounded text-gray-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-[#2dd4a8] rounded-md hover:bg-[#25b890] transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-1.5">
        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          Compare
        </label>
        <select
          value={comparison}
          onChange={(e) => onComparisonChange(e.target.value)}
          className="bg-white border border-gray-200 rounded-md px-3 py-1.5 text-sm text-gray-700 min-w-[180px] appearance-none cursor-pointer"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
        >
          <option value="pop">Previous period</option>
          <option value="yoy">Same period last year</option>
        </select>
      </div>
    </div>
  );
}
