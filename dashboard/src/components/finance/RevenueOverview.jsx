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

export default function RevenueOverview({ orders }) {
  const data = revenueByField(orders, "Product Name");

  return (
    <div className="panel">
      <h3>Revenue by Course</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 120 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            tickFormatter={(v) => `$${v.toLocaleString()}`}
          />
          <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => formatDollars(v)} />
          <Bar dataKey="total" fill={COLORS.teal} name="Revenue" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
