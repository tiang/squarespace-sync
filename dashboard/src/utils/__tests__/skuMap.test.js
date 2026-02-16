import { describe, it, expect } from "vitest";
import { normalizeSku, normalizeOrder, SKU_OVERRIDES } from "../skuMap";

describe("normalizeSku", () => {
  it("returns the raw SKU unchanged when no override exists", () => {
    const result = normalizeSku("INTRO-2025-T1");
    expect(result).toEqual({ sku: "INTRO-2025-T1", productName: null });
  });

  it("returns null productName for falsy input", () => {
    expect(normalizeSku(null)).toEqual({ sku: null, productName: null });
    expect(normalizeSku(undefined)).toEqual({ sku: undefined, productName: null });
  });
});

describe("normalizeOrder", () => {
  it("returns the order unchanged when no override matches", () => {
    const order = { SKU: "INTRO-2025-T1", "Product Name": "Intro" };
    expect(normalizeOrder(order)).toBe(order); // same reference
  });

  it("does not add _rawSku when no override is applied", () => {
    const order = { SKU: "SOME-SKU" };
    expect(normalizeOrder(order)._rawSku).toBeUndefined();
  });
});

describe("SKU_OVERRIDES", () => {
  it("is an object (can be empty)", () => {
    expect(typeof SKU_OVERRIDES).toBe("object");
    expect(SKU_OVERRIDES).not.toBeNull();
  });
});
