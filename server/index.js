const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

async function requireValidTable(req, res, next) {
  try {
    const tableId = String(req.body.tableId || req.params.tableId || "");
    const token = String(req.body.token || req.query.token || "");

    if (!tableId) return res.status(400).json({ error: "tableId is required" });
    if (!token) return res.status(401).json({ error: "token is required" });

    const table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table || !table.isActive) return res.status(404).json({ error: "table not found" });
    if (table.token !== token) return res.status(403).json({ error: "invalid token" });

    req.table = table;
    next();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server error" });
  }
}

// --- Create HTTP server + Socket.IO FIRST ---
const PORT = process.env.PORT || 4000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  socket.on("disconnect", () => console.log("Socket disconnected:", socket.id));
});

// --- Temporary menu (local file for now) ---
const menu = require("./data/menu");

// Health
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Menu
app.get("/menu", (req, res) => res.json(menu));

/* =========================
   ORDERS (Prisma)
========================= */

// Create order
app.post("/orders", requireValidTable, async (req, res) => {
  try {
    const { tableId, items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items must be a non-empty array" });
    }

    const order = await prisma.order.create({
      data: {
        tableId: String(tableId),
        status: "UNCLAIMED",
        items: {
          create: items.map((it) => ({
            itemId: String(it.itemId),
            name: String(it.name),
            price: Number(it.price),
            qty: Number(it.qty),
            note: it.note ? String(it.note) : null,
          })),
        },
      },
      include: { items: true },
    });

    io.emit("order:new", order);
    res.status(201).json(order);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server error" });
  }
});

// List unclaimed
app.get("/orders/unclaimed", async (req, res) => {
  try {
    const data = await prisma.order.findMany({
      where: { status: "UNCLAIMED" },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });

    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server error" });
  }
});

// Claim (FIXED + atomic to prevent double-claim race)
app.patch("/orders/:orderId/claim", async (req, res) => {
  try {
    const { orderId } = req.params;
    const waiterId = Number(req.body.waiterId);

    if (!Number.isInteger(waiterId)) {
      return res.status(400).json({ error: "valid waiterId is required" });
    }

    // atomic update: only claim if still UNCLAIMED
    const result = await prisma.order.updateMany({
      where: { id: String(orderId), status: "UNCLAIMED" },
      data: {
        status: "CLAIMED",
        claimedById: waiterId,     // ✅ correct field
        claimedAt: new Date(),
      },
    });

    if (result.count === 0) {
      const exists = await prisma.order.findUnique({ where: { id: String(orderId) } });
      if (!exists) return res.status(404).json({ error: "order not found" });
      return res.status(409).json({ error: "order already claimed" });
    }

    const updated = await prisma.order.findUnique({
      where: { id: String(orderId) },
      include: { items: true },
    });

    io.emit("order:claimed", { orderId: String(orderId), waiterId });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server error" });
  }
});

// Unclaim (only same waiter can unclaim; set claimedById to null)
app.post("/orders/:id/unclaim", async (req, res) => {
  try {
    const orderId = String(req.params.id);
    const waiterId = Number(req.body.waiterId);

    if (!Number.isInteger(waiterId)) {
      return res.status(400).json({ error: "valid waiterId is required" });
    }

    const result = await prisma.order.updateMany({
      where: {
        id: orderId,
        status: "CLAIMED",
        claimedById: waiterId,
      },
      data: {
        status: "UNCLAIMED",
        claimedById: null,   // ✅ must be null
        claimedAt: null,
      },
    });

    if (result.count === 0) {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) return res.status(404).json({ error: "order not found" });
      if (order.status !== "CLAIMED") return res.status(409).json({ error: "order is not claimed" });
      return res.status(403).json({ error: "not your order" });
    }

    const updated = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    io.emit("order:updated", updated);
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server error" });
  }
});

// Claimed for waiter (FIXED: claimedById)
app.get("/orders/claimed/:waiterId", async (req, res) => {
  try {
    const waiterId = Number(req.params.waiterId);
    if (!Number.isInteger(waiterId)) {
      return res.status(400).json({ error: "valid waiterId is required" });
    }

    const data = await prisma.order.findMany({
      where: { status: "CLAIMED", claimedById: waiterId }, // ✅
      orderBy: { claimedAt: "desc" },
      include: { items: true },
    });

    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server error" });
  }
});

// Finish (delete) order - idempotent
app.delete("/orders/:orderId", async (req, res) => {
  try {
    const orderId = String(req.params.orderId);

    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existing) {
      return res.json({ success: true, orderId, alreadyDeleted: true });
    }

    await prisma.order.delete({ where: { id: orderId } });
    io.emit("order:deleted", { orderId });

    res.json({ success: true, orderId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server error" });
  }
});

/* =========================
   CALLS (Prisma)
========================= */

app.post("/calls", requireValidTable, async (req, res) => {
  try {
    const { tableId, type } = req.body;

    const call = await prisma.call.create({
      data: {
        tableId: String(tableId),
        type: type || "waiter",
        status: "OPEN",
      },
    });

    io.emit("call:new", call);
    res.status(201).json(call);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server error" });
  }
});

app.get("/tables/:tableId", async (req, res) => {
  try {
    const { tableId } = req.params;
    const token = String(req.query.token || "");

    const table = await prisma.table.findUnique({ where: { id: String(tableId) } });
    if (!table || !table.isActive) return res.status(404).json({ error: "table not found" });
    if (!token || table.token !== token) return res.status(403).json({ error: "invalid token" });

    res.json({ id: table.id, name: table.name });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server error" });
  }
});

app.get("/calls/open", async (req, res) => {
  try {
    const data = await prisma.call.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
    });
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server error" });
  }
});

app.patch("/calls/:callId/handle", async (req, res) => {
  const { callId } = req.params;
  const waiterId = Number(req.body.waiterId);

  if (!Number.isInteger(waiterId)) {
    return res.status(400).json({ error: "valid waiterId is required" });
  }

  const call = await prisma.call.findUnique({ where: { id: callId } });
  if (!call) return res.status(404).json({ error: "call not found" });
  if (call.status !== "OPEN") return res.status(409).json({ error: "already handled" });

  const updated = await prisma.call.update({
    where: { id: callId },
    data: {
      status: "HANDLED",
      handledById: waiterId,   // ✅ correct for your model
      handledAt: new Date(),
    },
  });

  io.emit("call:handled", { callId: updated.id, waiterId });
  res.json(updated);
});


/* =========================
   WAITERS
========================= */

app.post("/waiters/login", async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ error: "pin is required" });

    const waiter = await prisma.waiter.findUnique({
      where: { pin: String(pin) },
      select: { id: true, name: true, isActive: true },
    });

    if (!waiter || !waiter.isActive) {
      return res.status(401).json({ error: "invalid pin" });
    }

    res.json({ id: waiter.id, name: waiter.name });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server error" });
  }
});

app.get("/waiters", async (req, res) => {
  try {
    const waiters = await prisma.waiter.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });

    res.json(waiters);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server error" });
  }
});

app.get("/waiters/:waiterId", async (req, res) => {
  try {
    const id = Number(req.params.waiterId);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "invalid waiter id" });

    const w = await prisma.waiter.findUnique({
      where: { id },
      select: { id: true, name: true, isActive: true, createdAt: true },
    });

    if (!w) return res.status(404).json({ error: "waiter not found" });
    res.json(w);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server error" });
  }
});

// Start server
server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
