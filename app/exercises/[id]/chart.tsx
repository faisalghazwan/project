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
  date: number;
  e1rm: number;
};

export function HistoryChart({ data }: { data: ChartPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{ top: 12, right: 12, left: 0, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="2 4"
            vertical={false}
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
            tickLine={false}
            axisLine={false}
            className="text-[10px] text-zinc-400"
            tick={{ fill: "currentColor" }}
          />
          <YAxis
            stroke="currentColor"
            tickLine={false}
            axisLine={false}
            className="text-[10px] text-zinc-400"
            tick={{ fill: "currentColor" }}
            tickFormatter={(v) => `${Math.round(v)}`}
            width={32}
          />
          <Tooltip
            cursor={{ stroke: "currentColor", strokeOpacity: 0.15 }}
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid rgba(0,0,0,0.08)",
              padding: "6px 10px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
            labelFormatter={(t) =>
              new Date(t).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })
            }
            formatter={(v) => [`${Number(v).toFixed(1)} kg`, "e1RM"]}
          />
          <Line
            type="monotone"
            dataKey="e1rm"
            stroke="currentColor"
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 0, fill: "currentColor" }}
            activeDot={{ r: 5, strokeWidth: 0, fill: "currentColor" }}
            className="text-zinc-900 dark:text-zinc-50"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
