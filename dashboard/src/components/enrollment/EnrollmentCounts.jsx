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
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill={COLORS.primary} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="panel">
        <h3>Enrollment by School Year</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={bySchoolYear}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill={COLORS.purple} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="panel">
        <h3>Enrollment by Age Group</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={byAge}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill={COLORS.pink} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
