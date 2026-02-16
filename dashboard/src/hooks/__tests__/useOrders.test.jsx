import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useOrders } from "../useOrders";

// Mock the api module
vi.mock("../../api", () => ({
  fetchOrders: vi.fn(),
  refreshOrders: vi.fn(),
}));

import { fetchOrders, refreshOrders } from "../../api";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useOrders", () => {
  it("fetches orders on mount and sets loading to false", async () => {
    const mockData = [{ id: "1", "Product Name": "Class A" }];
    fetchOrders.mockResolvedValue(mockData);

    const { result } = renderHook(() => useOrders());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.orders).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(fetchOrders).toHaveBeenCalledOnce();
  });

  it("sets error when fetch fails", async () => {
    fetchOrders.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useOrders());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Network error");
    expect(result.current.orders).toEqual([]);
  });

  it("refresh calls refreshOrders and updates data", async () => {
    fetchOrders.mockResolvedValue([]);
    const refreshData = [{ id: "2", "Product Name": "Class B" }];
    refreshOrders.mockResolvedValue(refreshData);

    const { result } = renderHook(() => useOrders());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.refresh());

    await waitFor(() => {
      expect(result.current.orders).toEqual(refreshData);
    });
    expect(refreshOrders).toHaveBeenCalledOnce();
  });

  it("refresh sets error on failure", async () => {
    fetchOrders.mockResolvedValue([]);
    refreshOrders.mockRejectedValue(new Error("Refresh failed"));

    const { result } = renderHook(() => useOrders());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.refresh());

    await waitFor(() => {
      expect(result.current.error).toBe("Refresh failed");
    });
  });
});
