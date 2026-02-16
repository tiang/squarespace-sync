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
import { revenueByField, formatDollars } from "../../utils/transform";
import { COLORS } from "../../constants";

const tooltipStyle = {
  borderRadius: 8,
  border: "none",
  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
  fontSize: 13,
};

export default function RevenueOverview({ orders }) {
  const data = revenueByField(orders, "Product Name");

  return (
    <div className="panel">
      <h3>Revenue by Course</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 120 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis
            type="number"
            tickFormatter={(v) => `$${v.toLocaleString()}`}
            axisLine={false}
            tickLine={false}
          />
          <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v) => formatDollars(v)} contentStyle={tooltipStyle} cursor={{ fill: "rgba(46,196,182,0.06)" }} />
          <Bar dataKey="total" fill={COLORS.teal} name="Revenue" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
