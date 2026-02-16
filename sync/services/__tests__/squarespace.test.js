// Mock config before the service is imported
jest.mock("../../config", () => ({
  squarespace: {
    apiKey: "test-api-key",
    storeId: "test-store-id",
  },
}));

const mockGet = jest.fn();
jest.mock("axios", () => ({
  create: jest.fn(() => ({ get: mockGet })),
}));

const squarespaceService = require("../squarespace");

describe("SquarespaceService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getOrders", () => {
    test("calls /orders endpoint and returns response data", async () => {
      const mockData = { result: [{ id: "1" }], pagination: {} };
      mockGet.mockResolvedValue({ data: mockData });

      const result = await squarespaceService.getOrders({});
      expect(mockGet).toHaveBeenCalledWith("/orders", {
        params: expect.any(Object),
      });
      expect(result).toEqual(mockData);
    });

    test("passes modifiedAfter and modifiedBefore params", async () => {
      mockGet.mockResolvedValue({ data: { result: [] } });

      await squarespaceService.getOrders({
        modifiedAfter: "2025-01-01",
        modifiedBefore: "2025-01-31",
      });

      expect(mockGet).toHaveBeenCalledWith("/orders", {
        params: expect.objectContaining({
          modifiedAfter: "2025-01-01",
          modifiedBefore: "2025-01-31",
        }),
      });
    });

    test("throws formatted error on API error response", async () => {
      mockGet.mockRejectedValue({
        response: { status: 401, data: { message: "Unauthorized" } },
      });

      await expect(squarespaceService.getOrders({})).rejects.toThrow(
        "Squarespace API error: 401 - Unauthorized"
      );
    });

    test("rethrows non-API errors as-is", async () => {
      const networkError = new Error("Network timeout");
      mockGet.mockRejectedValue(networkError);

      await expect(squarespaceService.getOrders({})).rejects.toThrow(
        "Network timeout"
      );
    });
  });

  describe("getAllOrders", () => {
    test("fetches single page when no cursor returned", async () => {
      mockGet.mockResolvedValue({
        data: {
          result: [{ id: "1" }, { id: "2" }],
          pagination: {},
        },
      });

      const orders = await squarespaceService.getAllOrders(
        new Date("2025-01-01"),
        new Date("2025-01-31")
      );

      expect(orders).toHaveLength(2);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    test("paginates using cursor until no more pages", async () => {
      mockGet
        .mockResolvedValueOnce({
          data: {
            result: [{ id: "1" }],
            pagination: { nextPageCursor: "cursor-abc" },
          },
        })
        .mockResolvedValueOnce({
          data: {
            result: [{ id: "2" }],
            pagination: {},
          },
        });

      const orders = await squarespaceService.getAllOrders(
        new Date("2025-01-01"),
        new Date("2025-01-31")
      );

      expect(orders).toHaveLength(2);
      expect(orders[0].id).toBe("1");
      expect(orders[1].id).toBe("2");
      expect(mockGet).toHaveBeenCalledTimes(2);
    });

    test("second page uses cursor param instead of date params", async () => {
      mockGet
        .mockResolvedValueOnce({
          data: {
            result: [{ id: "1" }],
            pagination: { nextPageCursor: "cursor-abc" },
          },
        })
        .mockResolvedValueOnce({
          data: { result: [], pagination: {} },
        });

      await squarespaceService.getAllOrders(
        new Date("2025-01-01"),
        new Date("2025-01-31")
      );

      const secondCallParams = mockGet.mock.calls[1][1].params;
      expect(secondCallParams).toEqual({ cursor: "cursor-abc" });
    });

    test("returns empty array when API returns no orders", async () => {
      mockGet.mockResolvedValue({
        data: { result: [], pagination: {} },
      });

      const orders = await squarespaceService.getAllOrders(
        new Date("2025-01-01"),
        new Date("2025-01-31")
      );

      expect(orders).toEqual([]);
    });
  });

  describe("getOrder", () => {
    test("fetches single order by ID", async () => {
      mockGet.mockResolvedValue({ data: { id: "order-123" } });

      const result = await squarespaceService.getOrder("order-123");
      expect(mockGet).toHaveBeenCalledWith("/orders/order-123");
      expect(result).toEqual({ id: "order-123" });
    });

    test("throws formatted error on API error", async () => {
      mockGet.mockRejectedValue({
        response: { status: 404, data: { message: "Not Found" } },
      });

      await expect(squarespaceService.getOrder("bad-id")).rejects.toThrow(
        "Squarespace API error: 404 - Not Found"
      );
    });
  });
});
