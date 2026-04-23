"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";

export function SparklineChart({
  data,
  height = 60,
}: {
  data: Array<{ date: string; clicks: number }>;
  height?: number;
}) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            contentStyle={{ fontSize: 12, border: "1px solid var(--border)", background: "var(--card)" }}
            labelStyle={{ color: "var(--foreground)" }}
            itemStyle={{ color: "var(--primary)" }}
          />
          <Area
            type="monotone"
            dataKey="clicks"
            stroke="#4F46E5"
            strokeWidth={2}
            fill="url(#sparkGradient)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LineChartBig({ data }: { data: Array<{ date: string; clicks: number }> }) {
  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="bigGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            contentStyle={{ fontSize: 12, border: "1px solid var(--border)", background: "var(--card)" }}
            labelStyle={{ color: "var(--foreground)" }}
            itemStyle={{ color: "var(--primary)" }}
          />
          <Area type="monotone" dataKey="clicks" stroke="#4F46E5" strokeWidth={2.5} fill="url(#bigGradient)" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
