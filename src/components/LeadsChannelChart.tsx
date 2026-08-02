"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface ChannelData {
  channel: string;
  leads: number;
  color: string;
}

interface LeadsChannelChartProps {
  data: ChannelData[];
}

export default function LeadsChannelChart({ data }: LeadsChannelChartProps) {
  const chartData = {
    labels: data.map((d) => d.channel),
    datasets: [
      {
        label: "Sessions",
        data: data.map((d) => d.leads),
        backgroundColor: "#9ca3af",
        borderRadius: 3,
        maxBarThickness: 18,
      },
    ],
  };

  const options = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom" as const,
        labels: { font: { size: 10 }, color: "#6b7280", boxWidth: 12, padding: 16 },
      },
      tooltip: {
        backgroundColor: "#1f2937",
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
        cornerRadius: 6,
        padding: 10,
        callbacks: {
          label: (ctx: { parsed: { x: number | null } }) =>
            `${(ctx.parsed.x ?? 0).toLocaleString()} sessions`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: "#f3f4f6" },
        ticks: {
          font: { size: 10 },
          color: "#9ca3af",
          callback: (v: number | string) => {
            const n = Number(v);
            return n >= 1000 ? `${Math.round(n / 1000)}K` : String(n);
          },
        },
        border: { display: false },
      },
      y: {
        grid: { display: false },
        ticks: { font: { size: 10 }, color: "#6b7280" },
        border: { display: false },
      },
    },
  };

  return (
    <div className="h-full">
      <Bar data={chartData} options={options} />
    </div>
  );
}
