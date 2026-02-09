const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

const menu = require("./data/menu");
const orders = []; // temporary (later DB)
const calls = []; // { id, tableId, type, status, createdAt, handledBy, handledAt }


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
    io.emit("order:new", order);
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

    io.emit("order:claimed", { orderId: order.id, waiterId });

    console.log(`ORDER CLAIMED: ${order.id} by ${waiterId}`);

    res.json(order);
});

// Customer calls waiter
app.post("/calls", (req, res) => {
  const { tableId, type } = req.body;

  if (!tableId) return res.status(400).json({ error: "tableId is required" });

  const call = {
    id: "c_" + Date.now(),
    tableId: String(tableId),
    type: type || "waiter", // waiter | bill | help
    status: "open",
    createdAt: new Date().toISOString(),
    handledBy: null,
    handledAt: null,
  };

  calls.unshift(call);

  // realtime to all waiters
  io.emit("call:new", call);

  res.status(201).json(call);
});

// List open calls (for waiter)
app.get("/calls/open", (req, res) => {
  res.json(calls.filter((c) => c.status === "open"));
});

// Mark call handled
app.patch("/calls/:callId/handle", (req, res) => {
  const { callId } = req.params;
  const { waiterId } = req.body;

  if (!waiterId) return res.status(400).json({ error: "waiterId is required" });

  const call = calls.find((c) => c.id === callId);
  if (!call) return res.status(404).json({ error: "call not found" });

  if (call.status !== "open") return res.status(409).json({ error: "already handled" });

  call.status = "handled";
  call.handledBy = waiterId;
  call.handledAt = new Date().toISOString();

  io.emit("call:handled", { callId: call.id, waiterId });

  res.json(call);
});


// List claimed orders for a specific waiter
app.get("/orders/claimed/:waiterId", (req, res) => {
  const { waiterId } = req.params;
  res.json(orders.filter((o) => o.status === "claimed" && o.claimedBy === waiterId));
});

// Finish (delete) an order (idempotent)
app.delete("/orders/:orderId", (req, res) => {
  const orderId = String(req.params.orderId);

  console.log("DELETE /orders:", orderId);
  console.log("Current order ids:", orders.map(o => o.id));

  const index = orders.findIndex((o) => String(o.id) === orderId);

  // If it's already gone (or wrong server instance), don't error — just succeed
  if (index === -1) {
    return res.json({ success: true, orderId, alreadyDeleted: true });
  }

  orders.splice(index, 1);

  io.emit("order:deleted", { orderId });

  res.json({ success: true, orderId });
});








const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PATCH"],
    },
});

io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
    });
});

server.listen(PORT, () => {
    console.log("Server running on port", PORT);
});
