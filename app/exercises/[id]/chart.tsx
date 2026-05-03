"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ChartPoint = {
  date: number; // unix ms
  e1rm: number;
};

export function HistoryChart({ data }: { data: ChartPoint[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
        >
          <CartesianGrid
            strokeDasharray="2 4"
            className="stroke-zinc-200 dark:stroke-zinc-800"
          />
          <XAxis
            dataKey="date"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(t) =>
              new Date(t).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })
            }
            stroke="currentColor"
            className="text-xs text-zinc-500"
          />
          <YAxis
            stroke="currentColor"
            className="text-xs text-zinc-500"
            tickFormatter={(v) => `${Math.round(v)}`}
            width={36}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 4,
              border: "1px solid #d4d4d8",
            }}
            labelFormatter={(t) => new Date(t).toLocaleDateString()}
            formatter={(v) => [`${Number(v).toFixed(1)} kg`, "e1RM"]}
          />
          <Line
            type="monotone"
            dataKey="e1rm"
            stroke="#18181b"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
