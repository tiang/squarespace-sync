import React, { useState, useMemo } from "react";

export default function DataTable({ columns, rows, highlightRow, pageSize = 25 }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(0);

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

  // Reset to first page when search/sort changes
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paged = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const start = sorted.length > 0 ? safePage * pageSize + 1 : 0;
  const end = Math.min((safePage + 1) * pageSize, sorted.length);

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function handleSearchChange(value) {
    setSearch(value);
    setPage(0);
  }

  return (
    <div>
      <div className="table-toolbar">
        <div className="search-input-wrapper">
          <input
            className="search-input"
            placeholder="Search..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {search && (
            <button
              className="search-clear"
              onClick={() => handleSearchChange("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
        <span className="table-result-count">
          {sorted.length} {sorted.length === 1 ? "result" : "results"}
        </span>
      </div>
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} onClick={() => handleSort(col.key)}>
                  {col.label}
                  {sortKey === col.key && (
                    <span className="sort-indicator">
                      {sortDir === "asc" ? " ▲" : " ▼"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
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
      </div>
      {sorted.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <p>No results found</p>
        </div>
      )}
      {totalPages > 1 && (
        <div className="table-pagination">
          <span className="table-pagination-info">
            Showing {start}–{end} of {sorted.length}
          </span>
          <div className="table-pagination-buttons">
            <button
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i)
              .filter((i) => {
                // Show first, last, and pages near current
                return i === 0 || i === totalPages - 1 || Math.abs(i - safePage) <= 1;
              })
              .reduce((acc, i, idx, arr) => {
                // Insert ellipsis for gaps
                if (idx > 0 && i - arr[idx - 1] > 1) {
                  acc.push({ type: "ellipsis", key: `e${i}` });
                }
                acc.push({ type: "page", key: i, value: i });
                return acc;
              }, [])
              .map((item) =>
                item.type === "ellipsis" ? (
                  <span key={item.key} style={{ padding: "4px 6px", color: "#999" }}>
                    ...
                  </span>
                ) : (
                  <button
                    key={item.key}
                    className={safePage === item.value ? "active" : ""}
                    onClick={() => setPage(item.value)}
                  >
                    {item.value + 1}
                  </button>
                )
              )}
            <button
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage(safePage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
