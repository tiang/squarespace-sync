// Map raw SKUs to corrected values.
// Populate this as you discover inconsistent SKUs via the SkuAudit panel.
//
// Format: 'raw-sku': { sku: 'CORRECTED-SKU', productName: 'Corrected Name' }
const SKU_OVERRIDES = {
  // Example:
  // 'old-intro-class': { sku: 'INTRO-2025-T1', productName: 'Intro to Coding' },
};

export function normalizeSku(rawSku) {
  if (!rawSku) return { sku: rawSku, productName: null };
  const override = SKU_OVERRIDES[rawSku];
  if (override) return override;
  return { sku: rawSku, productName: null };
}

export function normalizeOrder(order) {
  const rawSku = order["SKU"];
  const override = SKU_OVERRIDES[rawSku];
  if (!override) return order;
  return {
    ...order,
    SKU: override.sku,
    "Product Name": override.productName || order["Product Name"],
    _rawSku: rawSku,
  };
}

export { SKU_OVERRIDES };
