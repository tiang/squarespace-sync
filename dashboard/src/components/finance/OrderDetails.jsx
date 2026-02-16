import React from "react";
import DataTable from "../DataTable";
import { formatDollars } from "../../utils/transform";

const COLUMNS = [
  { key: "Order Number", label: "Order #" },
  {
    key: "Created Date",
    label: "Date",
    render: (v) => (v ? new Date(v).toLocaleDateString() : ""),
  },
  { key: "Student Name", label: "Student" },
  { key: "Product Name", label: "Course" },
  {
    key: "Total",
    label: "Amount",
    render: (v) => formatDollars(v),
  },
  { key: "Status", label: "Status" },
];

export default function OrderDetails({ orders }) {
  return (
    <div className="panel">
      <h3>Order Details</h3>
      <DataTable columns={COLUMNS} rows={orders} />
    </div>
  );
}
