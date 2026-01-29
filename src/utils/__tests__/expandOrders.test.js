const { expandOrdersByLineItems } = require("../expandOrders");

describe("expandOrdersByLineItems", () => {
  test("returns empty array for empty input", () => {
    expect(expandOrdersByLineItems([])).toEqual([]);
  });

  test("passes through single-item order unchanged", () => {
    const order = {
      id: "abc",
      orderNumber: "100",
      lineItems: [{ productName: "Item A", unitPricePaid: { value: "50" } }],
    };
    const result = expandOrdersByLineItems([order]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(order);
  });

  test("passes through order with undefined lineItems", () => {
    const order = { id: "abc", orderNumber: "100" };
    const result = expandOrdersByLineItems([order]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(order);
  });

  test("passes through order with exactly one lineItem", () => {
    const order = {
      id: "abc",
      orderNumber: "100",
      lineItems: [{ productName: "Only Item" }],
    };
    const result = expandOrdersByLineItems([order]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("abc");
  });

  test("splits two-item order into two records", () => {
    const order = {
      id: "abc",
      orderNumber: "100",
      lineItems: [
        { productName: "Item A", unitPricePaid: { value: "50" } },
        { productName: "Item B", unitPricePaid: { value: "30" } },
      ],
    };
    const result = expandOrdersByLineItems([order]);
    expect(result).toHaveLength(2);
  });

  test("appends -0, -1 suffixes to id and orderNumber", () => {
    const order = {
      id: "abc",
      orderNumber: "100",
      lineItems: [
        { productName: "A", unitPricePaid: { value: "50" } },
        { productName: "B", unitPricePaid: { value: "30" } },
      ],
    };
    const result = expandOrdersByLineItems([order]);
    expect(result[0].id).toBe("abc-0");
    expect(result[0].orderNumber).toBe("100-0");
    expect(result[1].id).toBe("abc-1");
    expect(result[1].orderNumber).toBe("100-1");
  });

  test("each expanded record has exactly one lineItem", () => {
    const order = {
      id: "abc",
      orderNumber: "100",
      lineItems: [
        { productName: "A", unitPricePaid: { value: "50" } },
        { productName: "B", unitPricePaid: { value: "30" } },
        { productName: "C", unitPricePaid: { value: "20" } },
      ],
    };
    const result = expandOrdersByLineItems([order]);
    expect(result).toHaveLength(3);
    result.forEach((r) => expect(r.lineItems).toHaveLength(1));
  });

  test("sets subtotal to the individual lineItem unitPricePaid", () => {
    const order = {
      id: "abc",
      orderNumber: "100",
      lineItems: [
        { productName: "A", unitPricePaid: { value: "50" } },
        { productName: "B", unitPricePaid: { value: "30" } },
      ],
    };
    const result = expandOrdersByLineItems([order]);
    expect(result[0].subtotal).toEqual({ value: "50" });
    expect(result[1].subtotal).toEqual({ value: "30" });
  });

  test("sets _originalOrderId and _lineItemIndex metadata", () => {
    const order = {
      id: "abc",
      orderNumber: "100",
      lineItems: [
        { productName: "A", unitPricePaid: { value: "50" } },
        { productName: "B", unitPricePaid: { value: "30" } },
      ],
    };
    const result = expandOrdersByLineItems([order]);
    expect(result[0]._originalOrderId).toBe("abc");
    expect(result[0]._lineItemIndex).toBe(0);
    expect(result[1]._originalOrderId).toBe("abc");
    expect(result[1]._lineItemIndex).toBe(1);
  });

  test("preserves other order fields on expanded records", () => {
    const order = {
      id: "abc",
      orderNumber: "100",
      customerEmail: "test@example.com",
      lineItems: [
        { productName: "A", unitPricePaid: { value: "50" } },
        { productName: "B", unitPricePaid: { value: "30" } },
      ],
    };
    const result = expandOrdersByLineItems([order]);
    expect(result[0].customerEmail).toBe("test@example.com");
    expect(result[1].customerEmail).toBe("test@example.com");
  });

  test("handles mix of single and multi-item orders", () => {
    const orders = [
      { id: "single", orderNumber: "1", lineItems: [{ productName: "A" }] },
      {
        id: "multi",
        orderNumber: "2",
        lineItems: [
          { productName: "B", unitPricePaid: { value: "10" } },
          { productName: "C", unitPricePaid: { value: "20" } },
        ],
      },
    ];
    const result = expandOrdersByLineItems(orders);
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe("single");
    expect(result[1].id).toBe("multi-0");
    expect(result[2].id).toBe("multi-1");
  });
});
