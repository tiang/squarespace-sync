const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", "..", ".env") });

const express = require("express");
const { getAllRecords, clearCache } = require("./airtable");

const app = express();
const PORT = process.env.DASHBOARD_PORT || 3001;

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/orders", async (req, res) => {
  try {
    const records = await getAllRecords();
    res.json(records);
  } catch (error) {
    console.error("Error fetching orders:", error.message);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

app.post("/api/orders/refresh", async (req, res) => {
  try {
    clearCache();
    const records = await getAllRecords();
    res.json(records);
  } catch (error) {
    console.error("Error refreshing orders:", error.message);
    res.status(500).json({ error: "Failed to refresh orders" });
  }
});

// Serve static files in production
const distPath = path.resolve(__dirname, "..", "dist");
app.use(express.static(distPath));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Dashboard server running on http://localhost:${PORT}`);
});
