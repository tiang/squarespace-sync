import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { groupByMonth, formatDollars } from "../../utils/transform";
import { COLORS } from "../../constants";

const tooltipStyle = {
  borderRadius: 8,
  border: "none",
  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
  fontSize: 13,
};

export default function RevenueTrends({ orders }) {
  const data = groupByMonth(orders);

  return (
    <div className="panel">
      <h3>Revenue Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.teal} stopOpacity={0.3} />
              <stop offset="100%" stopColor={COLORS.teal} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => `$${v.toLocaleString()}`} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v) => formatDollars(v)} contentStyle={tooltipStyle} cursor={{ fill: "rgba(46,196,182,0.06)" }} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke={COLORS.teal}
            strokeWidth={2}
            fill="url(#revenueGradient)"
            dot={{ r: 4, fill: COLORS.teal, strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 6, fill: COLORS.teal, strokeWidth: 2, stroke: "#fff" }}
            name="Revenue"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
