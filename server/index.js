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
  const tableId = String(req.body.tableId || req.params.tableId || "");
  const token = String(req.body.token || req.query.token || "");

  if (!tableId) return res.status(400).json({ error: "tableId is required" });
  if (!token) return res.status(401).json({ error: "token is required" });

  const table = await prisma.table.findUnique({ where: { id: tableId } });
  if (!table || !table.isActive) return res.status(404).json({ error: "table not found" });
  if (table.token !== token) return res.status(403).json({ error: "invalid token" });

  req.table = table;
  next();
}


// --- Create HTTP server + Socket.IO FIRST (so io exists for routes) ---
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

// --- Temporary menu + in-memory orders (we will move orders/menu to DB next) ---
const menu = require("./data/menu");


// Health
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Menu (still local file for now)
app.get("/menu", (req, res) => {
    res.json(menu);
});

// Create order (in-memory for now)
app.post("/orders", requireValidTable, async (req, res) => {
  const { tableId, items } = req.body;

/*   if (!tableId) return res.status(400).json({ error: "tableId is required" });
 */  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: "items must be a non-empty array" });

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
});


// list unclaimed
app.get("/orders/unclaimed", async (req, res) => {
  const data = await prisma.order.findMany({
    where: { status: "UNCLAIMED" },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  res.json(data);
});


// claim
app.patch("/orders/:orderId/claim", async (req, res) => {
  const { orderId } = req.params;
  const { waiterId } = req.body;

  if (!waiterId) return res.status(400).json({ error: "waiterId is required" });

  const existing = await prisma.order.findUnique({ where: { id: orderId } });
  if (!existing) return res.status(404).json({ error: "order not found" });

  if (existing.status !== "UNCLAIMED") {
    return res.status(409).json({ error: "order already claimed" });
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "CLAIMED",
      claimedBy: String(waiterId),
      claimedAt: new Date(),
    },
    include: { items: true },
  });

  io.emit("order:claimed", { orderId: updated.id, waiterId });

  res.json(updated);
});


// claimed for waiter
app.get("/orders/claimed/:waiterId", async (req, res) => {
  const { waiterId } = req.params;

  const data = await prisma.order.findMany({
    where: { status: "CLAIMED", claimedBy: String(waiterId) },
    orderBy: { claimedAt: "desc" },
    include: { items: true },
  });

  res.json(data);
});


// finish (delete) order - idempotent
app.delete("/orders/:orderId", async (req, res) => {
  const orderId = String(req.params.orderId);

  const existing = await prisma.order.findUnique({ where: { id: orderId } });
  if (!existing) {
    return res.json({ success: true, orderId, alreadyDeleted: true });
  }

  await prisma.order.delete({ where: { id: orderId } });

  io.emit("order:deleted", { orderId });

  res.json({ success: true, orderId });
});


// CALLS (Prisma)
app.post("/calls", requireValidTable, async (req, res) => {
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
});

app.get("/tables/:tableId", async (req, res) => {
  const { tableId } = req.params;
  const token = String(req.query.token || "");

  const table = await prisma.table.findUnique({ where: { id: String(tableId) } });
  if (!table || !table.isActive) return res.status(404).json({ error: "table not found" });
  if (!token || table.token !== token) return res.status(403).json({ error: "invalid token" });

  res.json({ id: table.id, name: table.name });
});


app.get("/calls/open", async (req, res) => {
    const data = await prisma.call.findMany({
        where: { status: "OPEN" },
        orderBy: { createdAt: "desc" },
    });
    res.json(data);
});

app.patch("/calls/:callId/handle", async (req, res) => {
    const { callId } = req.params;
    const { waiterId } = req.body;

    if (!waiterId) return res.status(400).json({ error: "waiterId is required" });

    const call = await prisma.call.findUnique({ where: { id: callId } });
    if (!call) return res.status(404).json({ error: "call not found" });
    if (call.status !== "OPEN") return res.status(409).json({ error: "already handled" });

    const updated = await prisma.call.update({
        where: { id: callId },
        data: { status: "HANDLED", handledBy: waiterId, handledAt: new Date() },
    });

    io.emit("call:handled", { callId: updated.id, waiterId });
    res.json(updated);
});

/* app.post("/waiters/login", async (req, res) => {
  const { pin } = req.body;
  if (!pin) return res.status(400).json({ error: "pin is required" });

  const waiter = await prisma.waiter.findUnique({ where: { pin: String(pin) } });
  if (!waiter || !waiter.isActive) return res.status(401).json({ error: "invalid pin" });

  res.json({ id: waiter.id, name: waiter.name });
}); */

app.get("/waiters", async (req, res) => {
  const waiters = await prisma.waiter.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  res.json(waiters);
});


// Start server
server.listen(PORT, () => {
    console.log("Server running on port", PORT);
});
