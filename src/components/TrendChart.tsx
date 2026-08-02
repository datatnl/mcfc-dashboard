"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { DailyPoint } from "@/lib/live-data";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

interface TrendChartProps {
  data: DailyPoint[];
}

export default function TrendChart({ data }: TrendChartProps) {
  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        label: "Sessions",
        data: data.map((d) => d.sessions),
        borderColor: "#4F9CF7",
        backgroundColor: "#4F9CF720",
        fill: false,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
      {
        label: "Leads",
        data: data.map((d) => d.leads),
        borderColor: "#3DD9A4",
        backgroundColor: "#3DD9A420",
        fill: false,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        yAxisID: "y1",
      },
      {
        label: "Conversions",
        data: data.map((d) => d.conversions),
        borderColor: "#FF8C42",
        backgroundColor: "#FF8C4220",
        fill: false,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        yAxisID: "y1",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    layout: {
      padding: {
        top: 5,
        bottom: 5,
        left: 5,
        right: 5,
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1f2937",
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
        cornerRadius: 6,
        padding: 10,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 10 },
          color: "#9ca3af",
          maxTicksLimit: 10,
          padding: 8,
        },
        border: { display: false },
      },
      y: {
        position: "left" as const,
        beginAtZero: true,
        grid: { color: "#f3f4f6" },
        ticks: {
          font: { size: 10 },
          color: "#9ca3af",
          padding: 12,
          callback: (v: number | string) => {
            return Number(v).toLocaleString();
          },
        },
        border: { display: false },
      },
      y1: {
        position: "right" as const,
        beginAtZero: true,
        grid: { display: false },
        ticks: {
          font: { size: 10 },
          color: "#9ca3af",
          padding: 12,
        },
        border: { display: false },
      },
    },
  };

  const series = [
    { label: "Sessions", color: "#4F9CF7" },
    { label: "Leads", color: "#3DD9A4" },
    { label: "Conversions", color: "#FF8C42" },
  ];

  return (
    <div>
      <div className="flex items-center gap-5 mb-4">
        {series.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <div className="h-[260px]">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
