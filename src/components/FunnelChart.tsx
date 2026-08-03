"use client";

import { useRef, useEffect, useState } from "react";
import type { FunnelStep } from "@/lib/live-data";

interface FunnelChartProps {
  steps: FunnelStep[];
  loading?: boolean;
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function FunnelArea({ steps, height }: { steps: FunnelStep[]; height: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) setWidth(entry.contentRect.width);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const maxValue = steps[0].value;
    const colW = width / steps.length;

    // Slope happens WITHIN each column:
    // Left edge of column = this step's audience ratio
    // Right edge of column = next step's audience ratio (the dropoff)
    // Last column stays flat (final conversion, no further dropoff)
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "rgba(79, 156, 247, 0.30)");
    grad.addColorStop(1, "rgba(79, 156, 247, 0.10)");

    ctx.beginPath();
    ctx.moveTo(0, height); // bottom-left

    // Top edge: for each column, left edge is this step's level, right edge is next step's level
    for (let i = 0; i < steps.length; i++) {
      const thisRatio = steps[i].value / maxValue;
      const nextRatio = i < steps.length - 1 ? steps[i + 1].value / maxValue : thisRatio;
      const colLeft = colW * i;
      const colRight = colW * (i + 1);
      const leftTop = height - thisRatio * height;
      const rightTop = height - nextRatio * height;

      ctx.lineTo(colLeft, leftTop);
      ctx.lineTo(colRight, rightTop);
    }

    // Close along the bottom
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Stroke the top edge
    ctx.beginPath();
    for (let i = 0; i < steps.length; i++) {
      const thisRatio = steps[i].value / maxValue;
      const nextRatio = i < steps.length - 1 ? steps[i + 1].value / maxValue : thisRatio;
      const colLeft = colW * i;
      const colRight = colW * (i + 1);
      const leftTop = height - thisRatio * height;
      const rightTop = height - nextRatio * height;

      if (i === 0) ctx.moveTo(colLeft, leftTop);
      else ctx.lineTo(colLeft, leftTop);
      ctx.lineTo(colRight, rightTop);
    }
    ctx.strokeStyle = "rgba(79, 156, 247, 0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Column dividers (vertical dashed lines)
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 1;
    for (let i = 1; i < steps.length; i++) {
      const x = colW * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }, [steps, width, height]);

  return (
    <div ref={containerRef} className="relative bg-gray-50/50" style={{ height }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ width, height }} />
    </div>
  );
}

export default function FunnelChart({ steps, loading }: FunnelChartProps) {
  const maxValue = steps[0].value;
  const overallRate = ((steps[steps.length - 1].value / maxValue) * 100).toFixed(1);

  return (
    <div className="relative">
      {/* Summary bar */}
      <div className="flex items-center gap-8 mb-5 px-1">
        <div>
          <span className="text-2xl font-bold text-gray-900">{formatNumber(maxValue)}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold ml-2">Total Sessions</span>
        </div>
        <div>
          <span className="text-2xl font-bold text-[#3bd6ff]">{overallRate}%</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold ml-2">Conversion Rate</span>
        </div>
      </div>

      {/* Step headers */}
      <div className="grid border-b border-gray-200 bg-gray-50" style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}>
        {steps.map((step, i) => (
          <div key={step.label} className="px-4 py-3 border-r border-gray-200 last:border-r-0 text-center">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Step {i + 1}</div>
            <div className="text-sm font-bold text-gray-800">{step.label}</div>
            <div className="mt-1.5">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider">Sessions</div>
              <span className="text-xl font-bold text-gray-900">{formatNumber(step.value)}</span>
              {i > 0 && (
                <div className="text-[11px] text-gray-400 mt-0.5">
                  {((step.value / steps[i - 1].value) * 100).toFixed(1)}% of {formatNumber(steps[i - 1].value)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center rounded-lg backdrop-blur-[1px]">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading sessions...
          </div>
        </div>
      )}

      {/* Funnel area — full-width columns, height = proportion of total, filled from bottom */}
      <FunnelArea steps={steps} height={200} />

      {/* Dropoff indicators */}
      <div className="grid border-t border-gray-200" style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}>
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          const dropoffRate = step.abandonments
            ? ((step.abandonments / step.value) * 100).toFixed(1)
            : null;
          const isHighDropoff = dropoffRate && parseFloat(dropoffRate) > 80;

          return (
            <div key={step.label} className="px-4 py-4 flex flex-col items-center border-r border-gray-100 last:border-r-0">
              {/* Circle icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                isLast
                  ? "bg-[#3bd6ff]/15"
                  : isHighDropoff
                    ? "bg-red-50 border-2 border-red-200"
                    : "bg-gray-100"
              }`}>
                {isLast ? (
                  <svg className="w-5 h-5 text-[#3bd6ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className={`w-4 h-4 ${isHighDropoff ? "text-red-400" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
              </div>

              {isLast ? (
                <>
                  <span className="text-xl font-bold text-[#3bd6ff]">{overallRate}%</span>
                  <span className="text-[11px] font-bold text-[#3bd6ff] uppercase tracking-wider">Conversion</span>
                </>
              ) : (
                <>
                  <span className={`text-xl font-bold ${isHighDropoff ? "text-red-500" : "text-gray-700"}`}>
                    {dropoffRate}%
                  </span>
                  <span className="text-[10px] text-gray-400">
                    ({formatNumber(step.abandonments ?? 0)})
                  </span>
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Dropoff</span>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
