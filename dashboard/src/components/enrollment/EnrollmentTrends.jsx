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
import { groupByMonth } from "../../utils/transform";
import { COLORS } from "../../constants";

const tooltipStyle = {
  borderRadius: 8,
  border: "none",
  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
  fontSize: 13,
};

export default function EnrollmentTrends({ orders }) {
  const data = groupByMonth(orders);

  return (
    <div className="panel">
      <h3>Enrollment Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="enrollmentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.3} />
              <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(67,97,238,0.06)" }} />
          <Area
            type="monotone"
            dataKey="count"
            stroke={COLORS.primary}
            strokeWidth={2}
            fill="url(#enrollmentGradient)"
            dot={{ r: 4, fill: COLORS.primary, strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 6, fill: COLORS.primary, strokeWidth: 2, stroke: "#fff" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
