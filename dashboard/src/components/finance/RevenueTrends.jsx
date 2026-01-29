import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { groupByMonth, formatDollars } from "../../utils/transform";
import { COLORS } from "../../constants";

export default function RevenueTrends({ orders }) {
  const data = groupByMonth(orders);

  return (
    <div className="panel">
      <h3>Revenue Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v) => `$${v.toLocaleString()}`} />
          <Tooltip formatter={(v) => formatDollars(v)} />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke={COLORS.teal}
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Revenue"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
