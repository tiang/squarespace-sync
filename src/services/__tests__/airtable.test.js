jest.mock("../../config", () => ({
  airtable: {
    apiKey: "test-key",
    baseId: "test-base",
    tableName: "Orders",
  },
}));

const mockFirstPage = jest.fn();
const mockSelect = jest.fn(() => ({ firstPage: mockFirstPage }));
const mockUpdate = jest.fn();
const mockCreate = jest.fn();

const mockTable = {
  select: mockSelect,
  update: mockUpdate,
  create: mockCreate,
};

jest.mock("airtable", () => {
  return jest.fn().mockImplementation(() => ({
    base: jest.fn(() => jest.fn(() => mockTable)),
  }));
});

const airtableService = require("../airtable");

describe("AirtableService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelect.mockReturnValue({ firstPage: mockFirstPage });
  });

  describe("findOrderById", () => {
    test("queries with filter formula for Order ID", async () => {
      mockFirstPage.mockResolvedValue([{ id: "rec123" }]);

      const result = await airtableService.findOrderById("order-abc");

      expect(mockSelect).toHaveBeenCalledWith({
        filterByFormula: "{Order ID} = 'order-abc'",
        maxRecords: 1,
      });
      expect(result).toEqual({ id: "rec123" });
    });

    test("returns undefined when no record found", async () => {
      mockFirstPage.mockResolvedValue([]);

      const result = await airtableService.findOrderById("nonexistent");
      expect(result).toBeUndefined();
    });

    test("wraps errors with descriptive message", async () => {
      mockFirstPage.mockRejectedValue(new Error("Rate limit"));

      await expect(
        airtableService.findOrderById("x")
      ).rejects.toThrow("Airtable find error: Rate limit");
    });
  });

  describe("upsertOrder", () => {
    const order = {
      id: "order-1",
      orderNumber: "100",
      grandTotal: { value: "50", currency: "AUD" },
      lineItems: [],
    };

    test("creates new record when order does not exist", async () => {
      mockFirstPage.mockResolvedValue([]);
      mockCreate.mockResolvedValue({ id: "rec-new" });

      await airtableService.upsertOrder(order);
      expect(mockCreate).toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    test("updates existing record when order already exists", async () => {
      mockFirstPage.mockResolvedValue([{ id: "rec-existing" }]);
      mockUpdate.mockResolvedValue({ id: "rec-existing" });

      await airtableService.upsertOrder(order);
      expect(mockUpdate).toHaveBeenCalledWith(
        "rec-existing",
        expect.any(Object)
      );
      expect(mockCreate).not.toHaveBeenCalled();
    });

    test("wraps errors with order ID context", async () => {
      mockFirstPage.mockRejectedValue(new Error("API failure"));

      await expect(airtableService.upsertOrder(order)).rejects.toThrow(
        "Airtable upsert error for order order-1"
      );
    });
  });

  describe("bulkUpsertOrders", () => {
    function makeOrders(count) {
      return Array.from({ length: count }, (_, i) => ({
        id: `order-${i}`,
        orderNumber: `${i}`,
        grandTotal: { value: "10", currency: "AUD" },
        lineItems: [],
      }));
    }

    test("returns results for all orders", async () => {
      const orders = makeOrders(3);
      mockFirstPage.mockResolvedValue([]);
      mockCreate.mockResolvedValue({ id: "rec-new" });

      const results = await airtableService.bulkUpsertOrders(orders);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);
    });

    test("processes orders in chunks of 10", async () => {
      const orders = makeOrders(15);
      mockFirstPage.mockResolvedValue([]);
      mockCreate.mockResolvedValue({ id: "rec-new" });

      const results = await airtableService.bulkUpsertOrders(orders);
      expect(results).toHaveLength(15);
    });

    test("captures failures without stopping the batch", async () => {
      const orders = makeOrders(2);
      mockFirstPage.mockResolvedValue([]);
      mockCreate
        .mockResolvedValueOnce({ id: "rec-1" })
        .mockRejectedValueOnce(new Error("Field type mismatch"));

      const results = await airtableService.bulkUpsertOrders(orders);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toContain("Field type mismatch");
    });

    test("returns empty array for empty input", async () => {
      const results = await airtableService.bulkUpsertOrders([]);
      expect(results).toEqual([]);
    });
  });

  describe("getOrder", () => {
    test("returns transformed order when found", async () => {
      const mockRecord = {
        get: jest.fn((field) => {
          const fields = {
            "Order ID": "order-1",
            "Order Number": "100",
            Status: "FULFILLED",
            Total: 50,
            Currency: "AUD",
            Items: "[]",
            "Shipping Address": "null",
            "Billing Address": "null",
            "Raw Customizations": "[]",
          };
          return fields[field] || null;
        }),
      };
      mockFirstPage.mockResolvedValue([mockRecord]);

      const result = await airtableService.getOrder("order-1");
      expect(result).not.toBeNull();
      expect(result.id).toBe("order-1");
    });

    test("returns null when order not found", async () => {
      mockFirstPage.mockResolvedValue([]);

      const result = await airtableService.getOrder("nonexistent");
      expect(result).toBeNull();
    });
  });
});
