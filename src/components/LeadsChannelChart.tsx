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
        label: "Leads",
        data: data.map((d) => d.leads),
        backgroundColor: data.map((d) => d.color),
        borderRadius: 4,
        maxBarThickness: 36,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1f2937",
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
        cornerRadius: 6,
        padding: 10,
        callbacks: {
          label: (ctx: { parsed: { y: number | null } }) =>
            `${(ctx.parsed.y ?? 0).toLocaleString()} leads`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 9 }, color: "#6b7280", maxRotation: 45, minRotation: 45 },
        border: { display: false },
      },
      y: {
        grid: { color: "#f3f4f6" },
        ticks: {
          font: { size: 10 },
          color: "#9ca3af",
          callback: (v: number | string) => {
            return Number(v).toLocaleString();
          },
        },
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
