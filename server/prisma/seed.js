const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

// ✅ import your menu.js (adjust path if needed)
const menu = require("../data/menu"); 
// If your menu.js is not in prisma folder, you’ll change it like:
// const menu = require("../src/menu");  OR  require("../menu");

async function seedMenu() {
  console.log("Seeding menu categories & items...");

  // (optional but recommended) clear existing menu so re-seed is clean
  await prisma.menuItem.deleteMany({});
  await prisma.menuCategory.deleteMany({});

  for (const cat of menu) {
    const createdCat = await prisma.menuCategory.create({
      data: { name: cat.name },
    });

    if (cat.items?.length) {
      await prisma.menuItem.createMany({
        data: cat.items.map((it) => ({
          name: it.name,
          price: it.price,
          categoryId: createdCat.id,
        })),
      });
    }
  }

  console.log("✅ Seeded menu");
}

async function main() {
  console.log("DATABASE_URL =", process.env.DATABASE_URL);
  console.log("Seeding waiters...");

  await prisma.waiter.createMany({
    data: [
      { name: "Adnan", pin: "1111", isActive: true },
      { name: "Davud", pin: "2222", isActive: true },
      { name: "Faris", pin: "3333", isActive: true },
    ],
    skipDuplicates: true,
  });

  console.log("Seeding tables...");

  const tables = Array.from({ length: 10 }, (_, i) => ({
    id: `t${i + 1}`,
    name: `Table ${i + 1}`,
    token: crypto.randomUUID(),
    isActive: true,
  }));

  await prisma.table.createMany({
    data: tables,
    skipDuplicates: true,
  });

  // ✅ NEW
  await seedMenu();

  console.log("✅ Seeded waiters, tables, and menu");
}

main()
  .finally(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
