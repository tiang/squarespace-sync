import React, { useState, useMemo } from "react";

export default function DataTable({ columns, rows, highlightRow }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter((row) =>
      columns.some((col) => {
        const val = row[col.key];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [rows, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey] ?? "";
      const bVal = b[sortKey] ?? "";
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div>
      <input
        className="search-input"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} onClick={() => handleSort(col.key)}>
                {col.label}
                {sortKey === col.key ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={row._key || i}
              className={highlightRow && highlightRow(row) ? "highlight" : ""}
            >
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], row) : row[col.key] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <p style={{ textAlign: "center", padding: 20, color: "#888" }}>
          No results found
        </p>
      )}
    </div>
  );
}
