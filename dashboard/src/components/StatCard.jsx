import React from "react";

export default function StatCard({ title, value, prefix = "", icon, accent, trend }) {
  return (
    <div className="stat-card" data-accent={accent}>
      {icon && <div className="icon">{icon}</div>}
      <div className="label">{title}</div>
      <div className="value">
        {prefix}
        {value}
      </div>
      {trend && (
        <div className={`trend ${trend.direction}`}>{trend.label}</div>
      )}
    </div>
  );
}
