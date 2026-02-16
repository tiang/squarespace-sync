import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatCard from "../StatCard";

describe("StatCard", () => {
  it("renders title and value", () => {
    render(<StatCard title="Total Students" value={42} />);
    expect(screen.getByText("Total Students")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders prefix before value", () => {
    render(<StatCard title="Revenue" value="1,500" prefix="$" />);
    const valueEl = screen.getByText((_, el) => el.textContent === "$1,500");
    expect(valueEl).toBeInTheDocument();
  });

  it("renders without prefix by default", () => {
    render(<StatCard title="Count" value={10} />);
    const valueDiv = screen.getByText("10");
    expect(valueDiv).toBeInTheDocument();
  });

  it("has correct CSS classes", () => {
    const { container } = render(<StatCard title="Test" value={0} />);
    expect(container.querySelector(".stat-card")).toBeInTheDocument();
    expect(container.querySelector(".label")).toBeInTheDocument();
    expect(container.querySelector(".value")).toBeInTheDocument();
  });
});
