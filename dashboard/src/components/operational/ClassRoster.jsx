import React, { useState } from "react";

export default function ClassRoster({ classes }) {
  const [expanded, setExpanded] = useState({});

  function toggle(className) {
    setExpanded((prev) => ({ ...prev, [className]: !prev[className] }));
  }

  if (classes.length === 0) return null;

  return (
    <div className="panel">
      <h3>Class Rosters</h3>
      {classes.map((cls) => (
        <div key={cls.className} style={{ marginBottom: 16 }}>
          <button className="roster-toggle" onClick={() => toggle(cls.className)}>
            {expanded[cls.className] ? "▼" : "▶"} {cls.className} ({cls.students.length} students)
          </button>
          {expanded[cls.className] && (
            <table className="data-table" style={{ marginTop: 8 }}>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Age</th>
                  <th>Parent/Contact</th>
                  <th>Mobile</th>
                  <th>Medical Conditions</th>
                  <th>Photo</th>
                </tr>
              </thead>
              <tbody>
                {cls.students.map((s, i) => (
                  <tr
                    key={i}
                    className={s["Medical Conditions"] ? "highlight" : ""}
                  >
                    <td>{s["Student Name"] || ""}</td>
                    <td>{s["Student Age"] ?? ""}</td>
                    <td>{s["Contact Name"] || ""}</td>
                    <td>{s["Contact Mobile"] || ""}</td>
                    <td>{s["Medical Conditions"] || ""}</td>
                    <td>
                      {s["Photo Permission"] === "Yes" ? (
                        <span className="badge badge-success">Yes</span>
                      ) : s["Photo Permission"] === "No" ? (
                        <span className="badge badge-danger">No</span>
                      ) : (
                        s["Photo Permission"] || ""
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}
