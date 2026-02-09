const express = require("express");
const cors = require("cors");

const app = express();

const menu = require("./data/menu");
const orders = []; // temporary (later DB)


app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/menu", (req, res) => {
  res.json(menu);
});

// Create order
app.post("/orders", (req, res) => {
  const { tableId, items } = req.body;

  if (!tableId) return res.status(400).json({ error: "tableId is required" });
  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: "items must be a non-empty array" });

  const order = {
    id: "o_" + Date.now(),
    tableId: String(tableId),
    status: "unclaimed",
    createdAt: new Date().toISOString(),
    items, // [{ itemId, name, price, qty, note }]
    claimedBy: null,
  };

  orders.unshift(order);
  console.log("NEW ORDER:", order);

  res.status(201).json(order);
});

// (for waiter later) list unclaimed
app.get("/orders/unclaimed", (req, res) => {
  res.json(orders.filter((o) => o.status === "unclaimed"));
});

// Claim an order (Uber style)
app.patch("/orders/:orderId/claim", (req, res) => {
  const { orderId } = req.params;
  const { waiterId } = req.body;

  if (!waiterId) return res.status(400).json({ error: "waiterId is required" });

  const order = orders.find((o) => o.id === orderId);
  if (!order) return res.status(404).json({ error: "order not found" });

  if (order.status !== "unclaimed") {
    return res.status(409).json({ error: "order already claimed" });
  }

  order.status = "claimed";
  order.claimedBy = waiterId;
  order.claimedAt = new Date().toISOString();

  console.log(`ORDER CLAIMED: ${order.id} by ${waiterId}`);

  res.json(order);
});



const PORT = 4000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
