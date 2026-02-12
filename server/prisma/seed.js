const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.waiter.createMany({
    data: [
      { name: "Adnan", pin: "1111", isActive: true },
      { name: "Davud", pin: "2222", isActive: true },
      { name: "Faris", pin: "3333", isActive: true },
    ],
  });
  console.log("Seeded waiters ✅");
}

main()
  .finally(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
