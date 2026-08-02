"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { KpiMetric } from "@/lib/live-data";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const comparisonLabels: Record<string, string> = {
  pop: "vs previous period",
  yoy: "vs same period last year",
};

const comparisonLabelsShort: Record<string, string> = {
  pop: "vs prev. period",
  yoy: "vs last year",
};

interface KpiCardProps {
  metric: KpiMetric;
  comparison?: string;
}

function drawSparkline(canvas: HTMLCanvasElement, data: number[], color: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;

  ctx.clearRect(0, 0, w, h);

  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, color + "25");
  gradient.addColorStop(1, color + "05");

  ctx.beginPath();
  ctx.moveTo(pad, h);
  data.forEach((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    ctx.lineTo(x, y);
  });
  ctx.lineTo(w - pad, h);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.beginPath();
  data.forEach((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function generateModalDates(count: number): string[] {
  const dates: string[] = [];
  const end = new Date(2026, 6, 28);
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    dates.push(d.toLocaleDateString("en-AU", { day: "numeric", month: "short" }));
  }
  return dates;
}

function SparklineModal({ metric, onClose, comparison }: { metric: KpiMetric; onClose: () => void; comparison: string }) {
  const [showPrev, setShowPrev] = useState(false);
  const isPositive = metric.change >= 0;
  const color = isPositive ? "#10b981" : "#ef4444";
  const dates = generateModalDates(metric.sparkline.length);

  const rawValue = parseFloat(metric.value.replace(/[$,x%]/g, ""));
  const prevRaw = rawValue / (1 + metric.change / 100);
  const absDiff = rawValue - prevRaw;
  const prefix = metric.value.startsWith("$") ? "$" : "";
  const suffix = metric.value.endsWith("x") ? "x" : "";
  const isDecimal = metric.value.includes(".") && !metric.value.includes(",");
  const absDisplay = prefix + (isDecimal ? Math.abs(absDiff).toFixed(2) : Math.abs(Math.round(absDiff)).toLocaleString()) + suffix;
  const currentDisplay = prefix + (isDecimal ? rawValue.toFixed(2) : rawValue.toLocaleString()) + suffix;
  const prevDisplay = prefix + (isDecimal ? prevRaw.toFixed(2) : Math.round(prevRaw).toLocaleString()) + suffix;
  const compLabel = comparisonLabels[comparison] || "vs previous period";

  const scale = prevRaw / rawValue;
  const prevSparkline = metric.sparkline.map((v, i) => {
    const base = v * scale;
    const seed = (i * 7 + 13) % 17;
    const jitter = (seed / 17 - 0.5) * 0.06 * base;
    return Math.round((base + jitter) * 100) / 100;
  });

  const handleBackdrop = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const currentDataset = {
    label: "Current period",
    data: metric.sparkline,
    borderColor: color,
    backgroundColor: color + "15",
    fill: true,
    tension: 0.35,
    pointRadius: 4,
    pointBackgroundColor: color,
    pointBorderColor: "#fff",
    pointBorderWidth: 2,
    pointHoverRadius: 6,
    borderWidth: 2,
    borderDash: [] as number[],
  };

  const prevDataset = {
    label: "Previous period",
    data: prevSparkline,
    borderColor: "#9ca3af",
    backgroundColor: "transparent",
    fill: false,
    tension: 0.35,
    pointRadius: 3,
    pointBackgroundColor: "#9ca3af",
    pointBorderColor: "#fff",
    pointBorderWidth: 1,
    pointHoverRadius: 5,
    borderWidth: 2,
    borderDash: [6, 4],
  };

  const chartData = {
    labels: dates,
    datasets: showPrev ? [currentDataset, prevDataset] : [currentDataset],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1f2937",
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
        cornerRadius: 6,
        padding: 10,
        callbacks: {
          label: (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) => {
            const v = ctx.parsed.y ?? 0;
            const formatted = prefix + (isDecimal ? v.toFixed(2) : v.toLocaleString()) + suffix;
            return `${ctx.dataset.label}: ${formatted}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: "#f3f4f6" },
        ticks: { font: { size: 11 }, color: "#9ca3af", maxTicksLimit: 7 },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#f3f4f6" },
        ticks: {
          font: { size: 11 },
          color: "#9ca3af",
          callback: (v: number | string) => {
            const n = Number(v);
            return prefix + (isDecimal ? n.toFixed(1) : n.toLocaleString()) + suffix;
          },
        },
        border: { display: false },
      },
    },
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleBackdrop}
    >
      <div className="bg-white rounded-xl shadow-2xl w-[520px] max-w-[90vw] p-6 relative animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-lg font-bold text-gray-900">{metric.label}</h3>
          {metric.target && (
            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
              {metric.target}
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-3 mb-1">
          <span className="text-3xl font-bold text-gray-900">{metric.value}</span>
          <span className={`text-sm font-semibold ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
            {isPositive ? "▲" : "▼"} {isPositive ? "+" : ""}{metric.change}%
          </span>
          <span className={`text-sm ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
            {isPositive ? "+" : "-"}{absDisplay}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
          <span>29 Jun 2026 — 28 Jul 2026</span>
          <span className="text-gray-300">|</span>
          <span>{compLabel}</span>
        </div>

        <div className="text-sm text-gray-500 mb-4">
          {currentDisplay} vs {prevDisplay}
        </div>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-0.5 rounded" style={{ backgroundColor: color }} />
              Current period
            </span>
            {showPrev && (
              <span className="flex items-center gap-1.5 text-gray-400">
                <span className="inline-block w-3 h-0.5 rounded bg-gray-400" style={{ borderTop: "2px dashed #9ca3af", height: 0 }} />
                Previous period
              </span>
            )}
          </div>
          <button
            onClick={() => setShowPrev(!showPrev)}
            className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
              showPrev
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            {showPrev ? "Hide comparison" : "Show comparison"}
          </button>
        </div>

        <div className="h-[220px] mb-3">
          <Line data={chartData} options={chartOptions} />
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <span className="text-xs text-amber-700">Tolerance bands will appear here when live data is connected.</span>
        </div>
      </div>
    </div>
  );
}

export default function KpiCard({ metric, comparison = "pop" }: KpiCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const isPositive = metric.change >= 0;
  const sparkColor = isPositive ? "#10b981" : "#ef4444";

  useEffect(() => {
    if (canvasRef.current && !metric.unavailable) {
      drawSparkline(canvasRef.current, metric.sparkline, sparkColor);
    }
  }, [metric.sparkline, sparkColor, metric.unavailable]);

  if (metric.unavailable) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 p-4 flex flex-col min-w-0 opacity-50">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="text-[11px] text-gray-500 font-medium leading-tight">{metric.label}</span>
        </div>
        <span className="text-2xl font-bold text-gray-400 mb-2">—</span>
        <span className="text-[10px] text-gray-400">Awaiting data source</span>
        <div className="mt-auto h-10 flex items-center justify-center">
          <span className="text-[9px] text-gray-300 border border-dashed border-gray-200 rounded px-2 py-1">No data</span>
        </div>
      </div>
    );
  }

  const rawValue = parseFloat(metric.value.replace(/[$,x%]/g, ""));
  const prevRaw = rawValue / (1 + metric.change / 100);
  const prefix = metric.value.startsWith("$") ? "$" : "";
  const suffix = metric.value.endsWith("x") ? "x" : "";
  const isDecimal = metric.value.includes(".") && !metric.value.includes(",");
  const currentDisplay = prefix + (isDecimal ? rawValue.toFixed(2) : rawValue.toLocaleString()) + suffix;
  const prevDisplay = prefix + (isDecimal ? prevRaw.toFixed(2) : Math.round(prevRaw).toLocaleString()) + suffix;

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-100 p-4 flex flex-col min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="text-[11px] text-gray-500 font-medium leading-tight">{metric.label}</span>
          {metric.target && (
            <span className="text-[9px] text-gray-400 whitespace-nowrap">{metric.target}</span>
          )}
        </div>

        <span className="text-2xl font-bold text-gray-900 mb-2">{metric.value}</span>

        <div className="flex items-center gap-1.5 mb-1">
          <span className={`text-xs ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
            {isPositive ? "▲" : "▼"}
          </span>
          <span className={`text-xs font-semibold ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
            {isPositive ? "+" : ""}{metric.change}%
          </span>
          <span className="text-[10px] text-gray-400">{comparisonLabelsShort[comparison] || "vs prev. period"}</span>
        </div>

        <div className="text-[10px] text-gray-400 mb-3">
          {currentDisplay} vs {prevDisplay}
        </div>

        <div
          className="relative mt-auto cursor-pointer group"
          onClick={() => setModalOpen(true)}
        >
          <canvas ref={canvasRef} className="w-full h-10" />
          <div className="absolute inset-0 rounded bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="text-[9px] text-gray-500 bg-white/90 px-2 py-0.5 rounded shadow-sm">Click to expand</span>
          </div>
        </div>
      </div>

      {modalOpen && <SparklineModal metric={metric} comparison={comparison} onClose={() => setModalOpen(false)} />}
    </>
  );
}
