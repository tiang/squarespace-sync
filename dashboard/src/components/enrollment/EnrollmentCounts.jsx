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
import { countByField, ageBuckets } from "../../utils/transform";
import { COLORS } from "../../constants";

const tooltipStyle = {
  borderRadius: 8,
  border: "none",
  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
  fontSize: 13,
};

export default function EnrollmentCounts({ orders }) {
  const byCourse = countByField(orders, "Product Name");
  const bySchoolYear = countByField(orders, "School Year");
  const byAge = ageBuckets(orders);

  return (
    <div className="chart-grid">
      <div className="panel">
        <h3>Enrollment by Course</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={byCourse} layout="vertical" margin={{ left: 120 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis type="number" axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(67,97,238,0.06)" }} />
            <Bar dataKey="count" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="panel">
        <h3>Enrollment by School Year</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={bySchoolYear}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(114,9,183,0.06)" }} />
            <Bar dataKey="count" fill={COLORS.purple} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="panel">
        <h3>Enrollment by Age Group</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={byAge}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(247,37,133,0.06)" }} />
            <Bar dataKey="count" fill={COLORS.pink} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
