"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
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
  const min = Math.min(...data.map((d) => d.e1rm));
  const max = Math.max(...data.map((d) => d.e1rm));
  const pad = Math.max(2, (max - min) * 0.15);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <AreaChart
          data={data}
          margin={{ top: 14, right: 14, left: 0, bottom: 4 }}
        >
          <defs>
            <linearGradient id="e1rmFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="2 4"
            vertical={false}
            stroke="currentColor"
            strokeOpacity="0.12"
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
            tick={{ fill: "currentColor", fontSize: 10, opacity: 0.55 }}
          />
          <YAxis
            stroke="currentColor"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "currentColor", fontSize: 10, opacity: 0.55 }}
            tickFormatter={(v) => `${Math.round(v)}`}
            domain={[Math.max(0, min - pad), max + pad]}
            width={32}
          />
          <Tooltip
            cursor={{ stroke: "currentColor", strokeOpacity: 0.2 }}
            wrapperStyle={{ outline: "none" }}
            contentStyle={{
              fontSize: 11,
              borderRadius: 8,
              border: "1px solid rgba(0,0,0,0.08)",
              padding: "6px 10px",
              background: "rgba(255,255,255,0.96)",
              boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
              color: "#18181b",
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
          <Area
            type="monotone"
            dataKey="e1rm"
            stroke="currentColor"
            strokeWidth={2}
            fill="url(#e1rmFill)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: "currentColor" }}
            className="text-zinc-900 dark:text-zinc-50"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
