import React from "react";
import DataTable from "../DataTable";
import { getSkuSummary } from "../../utils/transform";

const COLUMNS = [
  { key: "rawSku", label: "Raw SKU" },
  { key: "normalizedSku", label: "Normalized SKU" },
  { key: "productName", label: "Product Name" },
  { key: "count", label: "Records" },
];

export default function SkuAudit({ orders }) {
  const skus = getSkuSummary(orders);

  return (
    <div className="panel">
      <h3>SKU Audit</h3>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>
        Review all unique SKUs. Rows where Raw SKU equals Normalized SKU have no
        override applied. Add overrides in <code>dashboard/src/utils/skuMap.js</code>.
      </p>
      <DataTable
        columns={COLUMNS}
        rows={skus}
        highlightRow={(row) => row.rawSku === row.normalizedSku && row.rawSku !== "(empty)"}
      />
    </div>
  );
}
