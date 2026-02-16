import React from "react";
import StatCard from "../StatCard";
import EnrollmentCounts from "./EnrollmentCounts";
import EnrollmentTrends from "./EnrollmentTrends";
import StudentDirectory from "./StudentDirectory";
import { countByField } from "../../utils/transform";

export default function EnrollmentSection({ orders }) {
  const totalStudents = orders.length;
  const activeCourses = new Set(orders.map((o) => o["Product Name"]).filter(Boolean)).size;
  const ages = orders.map((o) => o["Student Age"]).filter((a) => typeof a === "number");
  const avgAge = ages.length > 0 ? Math.round((ages.reduce((s, a) => s + a, 0) / ages.length) * 10) / 10 : "N/A";

  return (
    <div>
      <div className="stats-row">
        <StatCard title="Total Students" value={totalStudents} icon={"\uD83D\uDC69\u200D\uD83C\uDF93"} accent="primary" />
        <StatCard title="Active Courses" value={activeCourses} icon={"\uD83D\uDCDA"} accent="purple" />
        <StatCard title="Average Age" value={avgAge} icon={"\uD83C\uDF82"} accent="pink" />
      </div>
      <EnrollmentCounts orders={orders} />
      <EnrollmentTrends orders={orders} />
      <StudentDirectory orders={orders} />
    </div>
  );
}
