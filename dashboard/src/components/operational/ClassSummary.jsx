import React from "react";

export default function ClassSummary({ classes }) {
  if (classes.length === 0) return null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 16 }}>
      {classes.map((cls) => (
        <div key={cls.className} className="class-card">
          <h4>{cls.className}</h4>
          <div className="class-stats">
            <span>{cls.students.length} students</span>
            {cls.medicalCount > 0 && (
              <span className="badge badge-warning">
                {cls.medicalCount} medical
              </span>
            )}
            <span className="badge badge-success">
              Photo: {cls.photoYes}Y / {cls.photoNo}N
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
