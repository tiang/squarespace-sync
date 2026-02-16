import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import DataTable from "../DataTable";

afterEach(cleanup);

const columns = [
  { key: "name", label: "Name" },
  { key: "age", label: "Age" },
];

const rows = [
  { _key: "1", name: "Alice", age: 10 },
  { _key: "2", name: "Bob", age: 8 },
  { _key: "3", name: "Charlie", age: 12 },
];

describe("DataTable", () => {
  it("renders all rows", () => {
    render(<DataTable columns={columns} rows={rows} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  it("renders column headers", () => {
    render(<DataTable columns={columns} rows={rows} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Age")).toBeInTheDocument();
  });

  it("filters rows by search input", () => {
    render(<DataTable columns={columns} rows={rows} />);
    const input = screen.getByPlaceholderText("Search...");
    fireEvent.change(input, { target: { value: "alice" } });
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
  });

  it("shows no results message when search has no matches", () => {
    render(<DataTable columns={columns} rows={rows} />);
    fireEvent.change(screen.getByPlaceholderText("Search..."), {
      target: { value: "zzz" },
    });
    expect(screen.getByText("No results found")).toBeInTheDocument();
  });

  it("sorts rows ascending on column click", () => {
    render(<DataTable columns={columns} rows={rows} />);
    fireEvent.click(screen.getByText("Name"));
    const cells = screen.getAllByRole("cell");
    const names = [cells[0], cells[2], cells[4]].map((c) => c.textContent);
    expect(names).toEqual(["Alice", "Bob", "Charlie"]);
  });

  it("toggles sort direction on second click", () => {
    render(<DataTable columns={columns} rows={rows} />);
    const header = screen.getByText("Name");
    fireEvent.click(header); // asc
    fireEvent.click(header); // desc
    const cells = screen.getAllByRole("cell");
    const names = [cells[0], cells[2], cells[4]].map((c) => c.textContent);
    expect(names).toEqual(["Charlie", "Bob", "Alice"]);
  });

  it("sorts numeric columns correctly", () => {
    render(<DataTable columns={columns} rows={rows} />);
    fireEvent.click(screen.getByText("Age"));
    const cells = screen.getAllByRole("cell");
    const ages = [cells[1], cells[3], cells[5]].map((c) => c.textContent);
    expect(ages).toEqual(["8", "10", "12"]);
  });

  it("uses custom render function for columns", () => {
    const customColumns = [
      { key: "name", label: "Name", render: (val) => `** ${val} **` },
    ];
    render(<DataTable columns={customColumns} rows={rows} />);
    expect(screen.getByText("** Alice **")).toBeInTheDocument();
  });

  it("applies highlight class via highlightRow callback", () => {
    const highlightRow = (row) => row.name === "Bob";
    render(
      <DataTable columns={columns} rows={rows} highlightRow={highlightRow} />
    );
    const bobRow = screen.getByText("Bob").closest("tr");
    expect(bobRow).toHaveClass("highlight");

    const aliceRow = screen.getByText("Alice").closest("tr");
    expect(aliceRow).not.toHaveClass("highlight");
  });

  it("handles empty rows gracefully", () => {
    render(<DataTable columns={columns} rows={[]} />);
    expect(screen.getByText("No results found")).toBeInTheDocument();
  });
});
