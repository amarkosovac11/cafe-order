const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

function tableToken(id) {
  return crypto
    .createHash("sha256")
    .update(`table-${id}-dev-secret`)
    .digest("hex")
    .slice(0, 32);
}

async function resetDevData() {
  const reset = (process.env.SEED_RESET ?? "false").toLowerCase() === "true";
  if (!reset) return;

  console.log("🧹 SEED_RESET=true -> clearing tables...");

  // Clear in FK-safe order
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.call.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.table.deleteMany();
  await prisma.waiter.deleteMany();

  console.log("🧹 Clear done.");
}

async function seedTables() {
  for (let i = 1; i <= 12; i++) {
    const id = String(i);

    const existing = await prisma.table.findUnique({ where: { id } });
    if (existing) continue;

    await prisma.table.create({
      data: {
        id,
        name: `Table ${id}`,
        token: tableToken(id),
        isActive: true,
      },
    });
  }
  console.log("✅ Tables seeded (or already existed).");
}

async function seedWaiters() {
  const waiters = [
    { name: "Adnan", pin: "1111" },
    { name: "Faris", pin: "2222" },
    { name: "Davud", pin: "3333" },
  ];

  for (const w of waiters) {
    const exists = await prisma.waiter.findUnique({ where: { pin: w.pin } });
    if (exists) continue;

    await prisma.waiter.create({
      data: { name: w.name, pin: w.pin, isActive: true },
    });
  }

  console.log("✅ Waiters seeded (or already existed).");
}

async function seedMenu() {
  const count = await prisma.menuCategory.count();
  if (count > 0) {
    console.log("Menu already exists. Skipping menu seed.");
    return;
  }

  const menu = [
    {
      name: "Coffee",
      items: [
        { name: "Espresso", price: 2.5 },
        { name: "Americano", price: 2.8 },
        { name: "Cappuccino", price: 3.0 },
      ],
    },
    {
      name: "Desserts",
      items: [
        { name: "Cheesecake", price: 4.0 },
        { name: "Chocolate Cake", price: 4.5 },
      ],
    },
    // dodaj ostale kategorije...
  ];

  for (const cat of menu) {
    await prisma.menuCategory.create({
      data: {
        name: cat.name,
        items: { create: cat.items },
      },
    });
  }

  console.log("✅ Menu seeded.");
}

async function main() {
  console.log("🌱 Seeding DB...");

  const enabled = (process.env.SEED_ENABLED ?? "true").toLowerCase() === "true";
  if (!enabled) {
    console.log("🌱 Seeding disabled (SEED_ENABLED=false).");
    return;
  }

  await resetDevData();
  await seedTables();
  await seedWaiters();
  await seedMenu();

  console.log("✅ Seed done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });