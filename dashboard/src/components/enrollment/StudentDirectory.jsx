import React from "react";
import DataTable from "../DataTable";

const COLUMNS = [
  { key: "Student Name", label: "Student" },
  { key: "Student Age", label: "Age" },
  { key: "School Year", label: "School Year" },
  { key: "Product Name", label: "Course" },
  { key: "Contact Name", label: "Parent/Contact" },
  { key: "Contact Mobile", label: "Mobile" },
  { key: "Customer Email", label: "Email" },
];

export default function StudentDirectory({ orders }) {
  return (
    <div className="panel">
      <h3>Student Directory</h3>
      <DataTable columns={COLUMNS} rows={orders} />
    </div>
  );
}
