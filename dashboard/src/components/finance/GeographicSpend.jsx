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

export default function GeographicSpend({ orders }) {
  const data = spendByLocation(orders).slice(0, TOP_LOCATIONS_LIMIT);

  if (data.length === 0) {
    return (
      <div className="panel">
        <h3>Spend by Location</h3>
        <p style={{ color: "#888", padding: 20 }}>No geographic data available.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h3>Spend by Location (Top {TOP_LOCATIONS_LIMIT})</h3>
      <ResponsiveContainer width="100%" height={Math.max(300, data.length * 35)}>
        <BarChart data={data} layout="vertical" margin={{ left: 140 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            tickFormatter={(v) => `$${v.toLocaleString()}`}
          />
          <YAxis type="category" dataKey="location" width={130} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(v) => formatDollars(v)}
            labelFormatter={(label) => label}
          />
          <Bar dataKey="total" fill={COLORS.orange} name="Revenue" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
