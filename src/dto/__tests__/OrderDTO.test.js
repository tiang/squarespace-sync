const OrderDTO = require("../OrderDTO");

// Helper to build an order with customizations on a single line item
function makeOrder(customizations) {
  return {
    lineItems: [
      {
        customizations: customizations.map((c) => ({
          label: c.label,
          value: c.value,
        })),
      },
    ],
  };
}

// Helper to build a full order object
function makeFullOrder(overrides = {}) {
  return {
    id: "order-123",
    orderNumber: "1001",
    createdOn: "2025-01-01T00:00:00Z",
    modifiedOn: "2025-01-02T00:00:00Z",
    fulfillmentStatus: "FULFILLED",
    customerEmail: "test@example.com",
    grandTotal: { value: "100", currency: "AUD" },
    shippingAddress: { city: "Sydney" },
    billingAddress: { city: "Sydney" },
    lineItems: [
      {
        productName: "Coding Class",
        sku: "SKU-001",
        productId: "prod-1",
        variantId: "var-1",
        customizations: [
          { label: "Student Name", value: "Alice" },
          { label: "Student Age", value: "10" },
        ],
      },
    ],
    ...overrides,
  };
}

// Helper to build a mock Airtable record
function makeMockRecord(fieldMap) {
  return {
    get: (fieldName) =>
      fieldMap[fieldName] !== undefined ? fieldMap[fieldName] : null,
  };
}

describe("OrderDTO.extractCustomizations", () => {
  test("returns empty object when order has no lineItems", () => {
    const result = OrderDTO.extractCustomizations({});
    expect(result).toEqual({});
  });

  test("returns empty object when lineItems is not an array", () => {
    const result = OrderDTO.extractCustomizations({ lineItems: "bad" });
    expect(result).toEqual({});
  });

  test("returns all-null fields when lineItems is empty array", () => {
    const result = OrderDTO.extractCustomizations({ lineItems: [] });
    expect(result.student_name).toBeNull();
    expect(result.student_age).toBeNull();
    expect(result.parent_mobile).toBeNull();
    expect(result.photo_permission).toBeNull();
  });

  test('maps "Child\'s name" label to student_name', () => {
    const order = makeOrder([{ label: "Child's name", value: "Alice" }]);
    expect(OrderDTO.extractCustomizations(order).student_name).toBe("Alice");
  });

  test('maps "Student Name" label to student_name', () => {
    const order = makeOrder([{ label: "Student Name", value: "Bob" }]);
    expect(OrderDTO.extractCustomizations(order).student_name).toBe("Bob");
  });

  test('maps "Student\'s Name" label to student_name', () => {
    const order = makeOrder([{ label: "Student's Name", value: "Carol" }]);
    expect(OrderDTO.extractCustomizations(order).student_name).toBe("Carol");
  });

  test('extracts numeric age from "10 years old"', () => {
    const order = makeOrder([{ label: "Student Age", value: "10 years old" }]);
    expect(OrderDTO.extractCustomizations(order).student_age).toBe(10);
  });

  test("extracts numeric age from plain number string", () => {
    const order = makeOrder([{ label: "Student Age", value: "7" }]);
    expect(OrderDTO.extractCustomizations(order).student_age).toBe(7);
  });

  test("returns raw string when age has no digits", () => {
    const order = makeOrder([{ label: "Student Age", value: "five" }]);
    expect(OrderDTO.extractCustomizations(order).student_age).toBe("five");
  });

  test("extracts first number from string with multiple numbers", () => {
    const order = makeOrder([
      { label: "Student Age", value: "about 8 or 9 years" },
    ]);
    expect(OrderDTO.extractCustomizations(order).student_age).toBe(8);
  });

  test('normalizes "Yes, I consent" to "Yes"', () => {
    const order = makeOrder([
      { label: "Photo Permission", value: "Yes, I consent" },
    ]);
    expect(OrderDTO.extractCustomizations(order).photo_permission).toBe("Yes");
  });

  test('normalizes lowercase "yes" to "Yes"', () => {
    const order = makeOrder([{ label: "Photo Permission", value: "yes" }]);
    expect(OrderDTO.extractCustomizations(order).photo_permission).toBe("Yes");
  });

  test('normalizes "No" to "No"', () => {
    const order = makeOrder([{ label: "Photo Permission", value: "No" }]);
    expect(OrderDTO.extractCustomizations(order).photo_permission).toBe("No");
  });

  test('normalizes "true" to "Yes"', () => {
    const order = makeOrder([{ label: "Photo Permission", value: "true" }]);
    expect(OrderDTO.extractCustomizations(order).photo_permission).toBe("Yes");
  });

  test('normalizes "false" to "No"', () => {
    const order = makeOrder([{ label: "Photo Permission", value: "false" }]);
    expect(OrderDTO.extractCustomizations(order).photo_permission).toBe("No");
  });

  test("keeps original value when not recognizable as yes/no", () => {
    const order = makeOrder([{ label: "Photo Permission", value: "maybe" }]);
    expect(OrderDTO.extractCustomizations(order).photo_permission).toBe(
      "maybe"
    );
  });

  test('formats 10-digit number as "XXXX XXX XXX"', () => {
    const order = makeOrder([
      { label: "Parent/ Carer's Mobile", value: "0412345678" },
    ]);
    expect(OrderDTO.extractCustomizations(order).parent_mobile).toBe(
      "0412 345 678"
    );
  });

  test("formats 10-digit number with existing spaces", () => {
    const order = makeOrder([
      { label: "Parent/ Carer's Mobile", value: "0412 345 678" },
    ]);
    expect(OrderDTO.extractCustomizations(order).parent_mobile).toBe(
      "0412 345 678"
    );
  });

  test("formats 10-digit number with dashes", () => {
    const order = makeOrder([
      { label: "Parent/ Carer's Mobile", value: "04-1234-5678" },
    ]);
    expect(OrderDTO.extractCustomizations(order).parent_mobile).toBe(
      "0412 345 678"
    );
  });

  test("keeps original value when not 10 digits", () => {
    const order = makeOrder([
      { label: "Parent/ Carer's Mobile", value: "+61412345678" },
    ]);
    expect(OrderDTO.extractCustomizations(order).parent_mobile).toBe(
      "+61412345678"
    );
  });

  test("keeps original for short number", () => {
    const order = makeOrder([
      { label: "Parent/ Carer's Mobile", value: "12345" },
    ]);
    expect(OrderDTO.extractCustomizations(order).parent_mobile).toBe("12345");
  });

  test("extracts multiple fields from a single line item", () => {
    const order = makeOrder([
      { label: "Student Name", value: "Alice" },
      { label: "Student Age", value: "10" },
      { label: "Photo Permission", value: "Yes" },
    ]);
    const result = OrderDTO.extractCustomizations(order);
    expect(result.student_name).toBe("Alice");
    expect(result.student_age).toBe(10);
    expect(result.photo_permission).toBe("Yes");
  });

  test("ignores customization with unmapped label", () => {
    const order = makeOrder([{ label: "Favorite Color", value: "Blue" }]);
    const result = OrderDTO.extractCustomizations(order);
    expect(result).not.toHaveProperty("favorite_color");
    expect(result.student_name).toBeNull();
  });

  test("maps the long photo permission question label", () => {
    const longLabel =
      "We occasionally take and share photos from our classes on our social media accounts. Do you consent to your child's photos being included?";
    const order = makeOrder([{ label: longLabel, value: "Yes" }]);
    expect(OrderDTO.extractCustomizations(order).photo_permission).toBe("Yes");
  });

  test("maps medical condition labels", () => {
    const order = makeOrder([
      { label: "Any medical conditions?", value: "Asthma" },
    ]);
    expect(OrderDTO.extractCustomizations(order).medical_conditions).toBe(
      "Asthma"
    );
  });

  test("maps referral source labels", () => {
    const order = makeOrder([
      { label: "How did you hear about us?", value: "Google" },
    ]);
    expect(OrderDTO.extractCustomizations(order).referral_source).toBe(
      "Google"
    );
  });
});

describe("OrderDTO.toAirtableFields", () => {
  test("maps all base fields from a complete order", () => {
    const order = makeFullOrder();
    const fields = OrderDTO.toAirtableFields(order);

    expect(fields["Order ID"]).toBe("order-123");
    expect(fields["Order Number"]).toBe("1001");
    expect(fields["Created Date"]).toBe("2025-01-01T00:00:00Z");
    expect(fields["Modified Date"]).toBe("2025-01-02T00:00:00Z");
    expect(fields["Status"]).toBe("FULFILLED");
    expect(fields["Customer Email"]).toBe("test@example.com");
    expect(fields["Total"]).toBe(100);
    expect(fields["Currency"]).toBe("AUD");
  });

  test("extracts product details from first lineItem", () => {
    const order = makeFullOrder();
    const fields = OrderDTO.toAirtableFields(order);

    expect(fields["Product Name"]).toBe("Coding Class");
    expect(fields["SKU"]).toBe("SKU-001");
    expect(fields["Product ID"]).toBe("prod-1");
    expect(fields["Variant ID"]).toBe("var-1");
  });

  test("handles order with no lineItems gracefully", () => {
    const order = {
      id: "1",
      orderNumber: "1",
      grandTotal: { value: "0", currency: "AUD" },
    };
    const fields = OrderDTO.toAirtableFields(order);

    expect(fields["Product Name"]).toBeNull();
    expect(fields["SKU"]).toBeNull();
  });

  test("parseInt on grandTotal.value converts decimal string", () => {
    const order = makeFullOrder({
      grandTotal: { value: "100.50", currency: "AUD" },
    });
    const fields = OrderDTO.toAirtableFields(order);
    expect(fields["Total"]).toBe(100);
  });

  test("serializes lineItems as JSON string", () => {
    const order = makeFullOrder();
    const fields = OrderDTO.toAirtableFields(order);
    expect(typeof fields["Items"]).toBe("string");
    expect(JSON.parse(fields["Items"])).toEqual(order.lineItems);
  });

  test("serializes addresses as JSON strings", () => {
    const order = makeFullOrder();
    const fields = OrderDTO.toAirtableFields(order);
    expect(JSON.parse(fields["Shipping Address"])).toEqual({ city: "Sydney" });
    expect(JSON.parse(fields["Billing Address"])).toEqual({ city: "Sydney" });
  });

  test("includes custom field values from extractCustomizations", () => {
    const order = makeFullOrder();
    const fields = OrderDTO.toAirtableFields(order);
    expect(fields["Student Name"]).toBe("Alice");
    expect(fields["Student Age"]).toBe(10);
  });

  test("serializes raw customizations from lineItems", () => {
    const order = makeFullOrder();
    const fields = OrderDTO.toAirtableFields(order);
    const raw = JSON.parse(fields["Raw Customisations"]);
    expect(raw).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Student Name" }),
      ])
    );
  });
});

describe("OrderDTO.fromAirtableRecord", () => {
  test("returns null for null record", () => {
    expect(OrderDTO.fromAirtableRecord(null)).toBeNull();
  });

  test("returns null for undefined record", () => {
    expect(OrderDTO.fromAirtableRecord(undefined)).toBeNull();
  });

  test("maps record.get() values back to order shape", () => {
    const record = makeMockRecord({
      "Order ID": "order-123",
      "Order Number": "1001",
      Status: "FULFILLED",
      "Customer Email": "test@example.com",
      Total: 100,
      Currency: "AUD",
      Items: '[{"productName":"Coding Class"}]',
      "Shipping Address": '{"city":"Sydney"}',
      "Billing Address": "null",
      "Student Name": "Alice",
      "Student Age": 10,
      "Photo Permission": "Yes",
      "Raw Customizations": "[]",
    });
    const order = OrderDTO.fromAirtableRecord(record);

    expect(order.id).toBe("order-123");
    expect(order.orderNumber).toBe("1001");
    expect(order.fulfillmentStatus).toBe("FULFILLED");
    expect(order.customerEmail).toBe("test@example.com");
    expect(order.grandTotal).toEqual({ value: 100, currency: "AUD" });
    expect(order.lineItems).toEqual([{ productName: "Coding Class" }]);
    expect(order.shippingAddress).toEqual({ city: "Sydney" });
    expect(order.billingAddress).toBeNull();
    expect(order.customFields.student_name).toBe("Alice");
    expect(order.customFields.photo_permission).toBe("Yes");
  });

  test("handles missing Items field gracefully", () => {
    const record = makeMockRecord({});
    const order = OrderDTO.fromAirtableRecord(record);
    expect(order.lineItems).toEqual([]);
  });

  test("handles missing Shipping Address gracefully", () => {
    const record = makeMockRecord({});
    const order = OrderDTO.fromAirtableRecord(record);
    expect(order.shippingAddress).toBeNull();
  });
});

describe("OrderDTO.validateOrder", () => {
  test("does not throw for valid order", () => {
    expect(() =>
      OrderDTO.validateOrder({
        id: "1",
        orderNumber: "1",
        grandTotal: { value: "10" },
      })
    ).not.toThrow();
  });

  test("throws when id is missing", () => {
    expect(() =>
      OrderDTO.validateOrder({ orderNumber: "1", grandTotal: { value: "10" } })
    ).toThrow("id");
  });

  test("throws when orderNumber is missing", () => {
    expect(() =>
      OrderDTO.validateOrder({ id: "1", grandTotal: { value: "10" } })
    ).toThrow("orderNumber");
  });

  test("throws when grandTotal is missing", () => {
    expect(() =>
      OrderDTO.validateOrder({ id: "1", orderNumber: "1" })
    ).toThrow("grandTotal");
  });

  test("throws listing all missing fields when all are absent", () => {
    expect(() => OrderDTO.validateOrder({})).toThrow(
      "id, orderNumber, grandTotal"
    );
  });
});
