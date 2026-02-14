const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding waiters...");

  await prisma.waiter.createMany({
    data: [
      { name: "Adnan", pin: "1111", isActive: true },
      { name: "Davud", pin: "2222", isActive: true },
      { name: "Faris", pin: "3333", isActive: true },
    ],
    skipDuplicates: true, // safe if already seeded
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
    skipDuplicates: true, // prevents crash if run twice
  });

  console.log("✅ Seeded waiters and tables");
}

main()
  .finally(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
