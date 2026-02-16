import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { spendByLocation, formatDollars } from "../../utils/transform";
import { COLORS, TOP_LOCATIONS_LIMIT } from "../../constants";

const tooltipStyle = {
  borderRadius: 8,
  border: "none",
  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
  fontSize: 13,
};

export default function GeographicSpend({ orders }) {
  const data = spendByLocation(orders).slice(0, TOP_LOCATIONS_LIMIT);

  if (data.length === 0) {
    return (
      <div className="panel">
        <h3>Spend by Location</h3>
        <div className="empty-state">
          <div className="empty-icon">{"\uD83C\uDF0D"}</div>
          <p>No geographic data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <h3>Spend by Location (Top {TOP_LOCATIONS_LIMIT})</h3>
      <ResponsiveContainer width="100%" height={Math.max(300, data.length * 35)}>
        <BarChart data={data} layout="vertical" margin={{ left: 140 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis
            type="number"
            tickFormatter={(v) => `$${v.toLocaleString()}`}
            axisLine={false}
            tickLine={false}
          />
          <YAxis type="category" dataKey="location" width={130} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(v) => formatDollars(v)}
            labelFormatter={(label) => label}
            contentStyle={tooltipStyle}
            cursor={{ fill: "rgba(231,111,81,0.06)" }}
          />
          <Bar dataKey="total" fill={COLORS.orange} name="Revenue" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
