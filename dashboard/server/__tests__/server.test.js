import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";

// Mock the airtable module before importing anything that uses it
vi.mock("../airtable.js", () => ({
  getAllRecords: vi.fn(),
  clearCache: vi.fn(),
}));

// Build a minimal Express app mirroring server/index.js routes
import { getAllRecords, clearCache } from "../airtable.js";

function createApp() {
  const app = express();

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/orders", async (req, res) => {
    try {
      const records = await getAllRecords();
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders/refresh", async (req, res) => {
    try {
      clearCache();
      const records = await getAllRecords();
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to refresh orders" });
    }
  });

  return app;
}

describe("Dashboard Server API", () => {
  let app;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp();
  });

  describe("GET /api/health", () => {
    it("returns status ok", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: "ok" });
    });
  });

  describe("GET /api/orders", () => {
    it("returns records from Airtable", async () => {
      const mockRecords = [
        { id: "rec1", "Product Name": "Class A" },
        { id: "rec2", "Product Name": "Class B" },
      ];
      getAllRecords.mockResolvedValue(mockRecords);

      const res = await request(app).get("/api/orders");
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockRecords);
      expect(getAllRecords).toHaveBeenCalledOnce();
    });

    it("returns 500 when Airtable fails", async () => {
      getAllRecords.mockRejectedValue(new Error("Airtable error"));

      const res = await request(app).get("/api/orders");
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Failed to fetch orders" });
    });
  });

  describe("POST /api/orders/refresh", () => {
    it("clears cache and returns fresh records", async () => {
      const mockRecords = [{ id: "rec1", "Product Name": "Fresh" }];
      getAllRecords.mockResolvedValue(mockRecords);

      const res = await request(app).post("/api/orders/refresh");
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockRecords);
      expect(clearCache).toHaveBeenCalledOnce();
      expect(getAllRecords).toHaveBeenCalledOnce();
    });

    it("returns 500 when refresh fails", async () => {
      getAllRecords.mockRejectedValue(new Error("Airtable error"));

      const res = await request(app).post("/api/orders/refresh");
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Failed to refresh orders" });
      expect(clearCache).toHaveBeenCalledOnce();
    });
  });
});
