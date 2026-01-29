import React from "react";

export default function StatCard({ title, value, prefix = "" }) {
  return (
    <div className="stat-card">
      <div className="label">{title}</div>
      <div className="value">
        {prefix}
        {value}
      </div>
    </div>
  );
}
